import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing all collections...");

  await prisma.click.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.engagement.deleteMany({});
  await prisma.influencer.deleteMany({});
  await prisma.affiliateLink.deleteMany({});
  await prisma.affiliate.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("All collections emptied successfully.");
}

main()
  .catch((e) => {
    console.error("Error clearing collections:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
