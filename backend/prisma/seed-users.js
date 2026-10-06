// backend/prisma/seed-users.js
// Chạy: node prisma/seed-users.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ⭐ Password mặc định cho TẤT CẢ user mẫu
const DEFAULT_PASSWORD = 'vks@2026';

async function main() {
  console.log('🌱 Seed USERS mẫu...\n');

  // Hash password 1 lần dùng chung
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  console.log(`🔐 Password cho mọi user: ${DEFAULT_PASSWORD}\n`);

  // ═══════════════════════════════════════════
  // DANH SÁCH USER MẪU
  // ═══════════════════════════════════════════
  const sampleUsers = [
    // ADMIN
    {
      id: 'u_admin',
      username: 'admin',
      fullName: 'Quản trị viên hệ thống',
      role: 'ADMIN',
      roomCode: 'ADMIN',
      email: 'admin@vks.local',
      position: 'Quản trị viên',
    },

    // VIỆN TRƯỞNG
    {
      id: 'u_vt',
      username: 'vientruong',
      fullName: 'Viện trưởng',
      role: 'VIEN_TRUONG',
      roomCode: 'VT',
      email: 'vt@vks.local',
      position: 'Viện trưởng',
    },

    // 12 PHÓ VIỆN TRƯỞNG
    ...Array.from({ length: 12 }, (_, i) => ({
      id: `u_pvt${i + 1}`,
      username: `pvt${i + 1}`,
      fullName: `Phó Viện trưởng ${i + 1}`,
      role: 'PHO_VIEN_TRUONG',
      roomCode: `PVT${i + 1}`,
      position: 'Phó Viện trưởng',
    })),

    // 12 TRƯỞNG PHÒNG
    ...Array.from({ length: 12 }, (_, i) => ({
      id: `u_tp${i + 1}`,
      username: `tp${i + 1}`,
      fullName: `Trưởng phòng ${i + 1}`,
      role: 'TRUONG_PHONG',
      roomCode: `TP${i + 1}`,
      position: 'Trưởng phòng',
    })),
  ];

  // ═══════════════════════════════════════════
  // MAP ROLE → ROLE ID
  // ═══════════════════════════════════════════
  const roleIdMap = {
    ADMIN: 1,
    VIEN_TRUONG: 2,
    PHO_VIEN_TRUONG: 3,
    TRUONG_PHONG: 4,
  };

  let createdCount = 0;
  let updatedCount = 0;

  for (const u of sampleUsers) {
    // 1. Upsert user
    const existing = await prisma.user.findUnique({
      where: { username: u.username },
    });

    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {
        fullName: u.fullName,
        role: u.role,
        roomCode: u.roomCode,
        position: u.position,
        email: u.email || null,
        active: true,
      },
      create: {
        id: u.id,
        username: u.username,
        passwordHash,
        fullName: u.fullName,
        role: u.role,
        roomCode: u.roomCode,
        position: u.position,
        email: u.email || null,
        active: true,
      },
    });

    if (existing) updatedCount++;
    else createdCount++;

    // 2. Gán role vào user_roles
    const roleId = roleIdMap[u.role];
    if (roleId) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: { userId: user.id, roleId },
        },
        update: {},
        create: {
          userId: user.id,
          roleId,
          assignedBy: 'system',
        },
      });
    }

    // 3. Liên kết department nếu là TRUONG_PHONG
    if (u.role === 'TRUONG_PHONG') {
      const dept = await prisma.department.findUnique({
        where: { code: u.roomCode },
      });
      if (dept) {
        await prisma.user.update({
          where: { id: user.id },
          data: { departmentId: dept.id },
        });
        // Cập nhật manager cho department
        await prisma.department.update({
          where: { id: dept.id },
          data: { managerId: user.id },
        });
      }
    }
  }

  console.log(`✅ Đã tạo mới: ${createdCount} users`);
  console.log(`✅ Đã cập nhật: ${updatedCount} users`);
  console.log(`📊 Tổng: ${sampleUsers.length} users\n`);

  console.log('═══════════════════════════════════════');
  console.log('  🎉 SEED USERS HOÀN THÀNH!');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('📌 TÀI KHOẢN ĐĂNG NHẬP:');
  console.log('   ┌────────────┬──────────────┬──────────────┐');
  console.log('   │ Username   │ Password     │ Role         │');
  console.log('   ├────────────┼──────────────┼──────────────┤');
  console.log('   │ admin      │ vks@2026     │ ADMIN        │');
  console.log('   │ vientruong │ vks@2026     │ VIEN_TRUONG  │');
  console.log('   │ pvt1..12   │ vks@2026     │ PVT          │');
  console.log('   │ tp1..12    │ vks@2026     │ TRUONG_PHONG │');
  console.log('   └────────────┴──────────────┴──────────────┘');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });