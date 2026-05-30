import { prisma } from "./src/config/prisma";
import { listUnifiedFeed } from "./src/services/feed.service";

async function run() {
    const user = await prisma.user.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!user) return;
    console.log(`User: ${user.email}`);

    const result = await listUnifiedFeed(prisma, { limit: 10 });
    console.log(`Feed Items count: ${result.items.length}`);
    result.items.forEach((item, i) => {
        const id = item.kind === 'TRANSACTION' ? item.id : item.transferId;
        console.log(`${i}: ${item.kind} - ${id} - ${item.createdAt.toISOString()}`);
    });
}

run().catch(console.error).finally(() => prisma.$disconnect());
