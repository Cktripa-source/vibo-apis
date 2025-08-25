import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashedpassword',
      role: 'BUYER'
    },
  });
  console.log('Created user:', user);

  const users = await prisma.user.findMany();
  console.log('All users:', users);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
