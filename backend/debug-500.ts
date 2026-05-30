import { prisma } from "./src/config/prisma";
import { listUnifiedFeed } from "./src/services/feed.service";
import { ListFeedQueryInput } from "./src/validators/feed.schema";

async function main() {
    console.log("Starting feed debug...");
    try {
        // Mock a user with some data or just try to run it on current state
        // Find a user who has transactions
        const tx = await prisma.transaction.findFirst({
            where: { deletedAt: null }
        });

        if (!tx) {
            console.log("No transactions found in DB. Please run test-feed-module.js first (it might have failed after creating user).");
            // Find the last created user
            const user = await prisma.user.findFirst({
                orderBy: { createdAt: 'desc' }
            });
            if (user) {
                console.log(`Checking for user: ${user.email}`);
            } else {
                return;
            }
        }

        const input: ListFeedQueryInput = {
            limit: 10,
        };

        console.log("Calling listUnifiedFeed...");
        const result = await listUnifiedFeed(prisma, input);
        console.log("Success!", JSON.stringify(result, null, 2));
    } catch (error: any) {
        console.error("FAILED WITH ERROR:");
        console.error(error);
        if (error.code) console.error("Prisma Error Code:", error.code);
        if (error.meta) console.error("Prisma Error Meta:", error.meta);
    } finally {
        await prisma.$disconnect();
    }
}

main();
