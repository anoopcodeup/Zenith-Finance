import { PrismaClient, TransactionType, AccountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Create a Test User
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            passwordHash,
        },
    });
    console.log(`User created: ${user.email}`);

    // 2. Create Global Categories
    const globalCategories = [
        'Salary',
        'Food',
        'Rent',
        'Transport',
        'Entertainment',
        'Utilities',
        'Health',
        'Shopping',
        'Transfer',
    ];

    const categoryRecords = [];
    for (const name of globalCategories) {
        // Using findFirst instead of upsert to avoid unique constraint issues with null userId
        let category = await prisma.category.findFirst({
            where: { userId: null, name }
        });

        if (!category) {
            category = await prisma.category.create({
                data: { name, userId: null }
            });
        }
        categoryRecords.push(category);
    }
    console.log(`Global categories created: ${globalCategories.length}`);

    // 3. Create Accounts for the Test User
    const accounts = [
        { name: 'Main Savings', type: AccountType.SAVINGS },
        { name: 'Credit Card', type: AccountType.CREDIT },
        { name: 'Daily Cash', type: AccountType.CASH },
    ];

    const accountRecords = [];
    for (const acc of accounts) {
        // Using findFirst + create for clarity and to be safe
        let account = await prisma.account.findFirst({
            where: { userId: user.id, name: acc.name }
        });

        if (!account) {
            account = await prisma.account.create({
                data: {
                    userId: user.id,
                    name: acc.name,
                    type: acc.type,
                }
            });
        }
        accountRecords.push(account);
    }
    console.log(`Accounts created: ${accountRecords.length}`);

    // 4. Create Transactions
    const salaryCat = categoryRecords.find((c) => c.name === 'Salary')!;
    const foodCat = categoryRecords.find((c) => c.name === 'Food')!;
    const rentCat = categoryRecords.find((c) => c.name === 'Rent')!;
    const transportCat = categoryRecords.find((c) => c.name === 'Transport')!;
    const transferCat = categoryRecords.find((c) => c.name === 'Transfer')!;

    // Clear existing transactions to avoid duplicates if re-running
    await prisma.transaction.deleteMany({ where: { userId: user.id } });

    // Income
    await prisma.transaction.create({
        data: {
            userId: user.id,
            accountId: accountRecords[0].id, // Savings
            amount: 5000,
            type: TransactionType.INCOME,
            categoryId: salaryCat.id,
            description: 'Monthly Salary',
        },
    });

    // Expenses
    await prisma.transaction.create({
        data: {
            userId: user.id,
            accountId: accountRecords[0].id,
            amount: 1200,
            type: TransactionType.EXPENSE,
            categoryId: rentCat.id,
            description: 'Monthly Rent',
        },
    });

    await prisma.transaction.create({
        data: {
            userId: user.id,
            accountId: accountRecords[2].id, // Cash
            amount: 50,
            type: TransactionType.EXPENSE,
            categoryId: foodCat.id,
            description: 'Grocery Shopping',
        },
    });

    await prisma.transaction.create({
        data: {
            userId: user.id,
            accountId: accountRecords[1].id, // Credit
            amount: 30,
            type: TransactionType.EXPENSE,
            categoryId: transportCat.id,
            description: 'Uber Ride',
        },
    });

    // 5. Create a Transfer (Two transactions linked by transferId)
    const transferId = uuidv4();
    // Out from Savings
    await prisma.transaction.create({
        data: {
            userId: user.id,
            accountId: accountRecords[0].id,
            amount: 200,
            type: TransactionType.EXPENSE,
            categoryId: transferCat.id,
            description: 'Transfer to Cash',
            transferId,
        },
    });
    // In to Cash
    await prisma.transaction.create({
        data: {
            userId: user.id,
            accountId: accountRecords[2].id,
            amount: 200,
            type: TransactionType.INCOME,
            categoryId: transferCat.id,
            description: 'Transfer from Savings',
            transferId,
        },
    });

    console.log('Transactions created.');
    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
