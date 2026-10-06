// backend/scripts/fix-soft-deleted-users.js
// Chạy 1 lần: node scripts/fix-soft-deleted-users.js
import prisma from '../src/config/prisma.js';

async function main() {
  const softDeleted = await prisma.user.findMany({
    where: {
      deletedAt: { not: null },
      NOT: { username: { contains: '__deleted_' } },
    },
  });

  console.log(`🔍 Tìm thấy ${softDeleted.length} user xóa mềm chưa đổi suffix`);

  for (const user of softDeleted) {
    const stamp = user.deletedAt.getTime();
    const newUsername = `${user.username}__deleted_${stamp}`;
    const newEmail = user.email ? `${user.email}__deleted_${stamp}` : null;

    await prisma.user.update({
      where: { id: user.id },
      data: { username: newUsername, email: newEmail },
    });

    console.log(`✅ "${user.username}" → "${newUsername}"`);
  }

  console.log('🎉 Hoàn tất! Các username cũ đã được giải phóng.');
}

main()
  .catch((e) => { console.error('❌ Lỗi:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());