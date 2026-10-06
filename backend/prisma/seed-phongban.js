import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed departments...\n');

  // 12 phòng — CHỈ có code + name
  const departments = [
    { code: 'TP1',  name: 'Phòng 1 (Án an ninh)' },
    { code: 'TP2',  name: 'Phòng 2 (Án trật tự XH)' },
    { code: 'TP3',  name: 'Phòng 3 (Án kinh tế, tham nhũng)' },
    { code: 'TP4',  name: 'Phòng 4 (Tổng hợp nghiệp vụ)' },
    { code: 'TP5',  name: 'Văn phòng VKSND' },
    { code: 'TP6',  name: 'Thanh tra Viện' },
    { code: 'TP7',  name: 'Phòng 7 (KSXX hình sự)' },
    { code: 'TP8',  name: 'Phòng 8 (Tạm giữ, tạm giam)' },
    { code: 'TP9',  name: 'Phòng 9 (Giải quyết án dân sự)' },
    { code: 'TP10', name: 'Phòng 10 (Án hành chính)' },
    { code: 'TP11', name: 'Phòng 11 (KS thi hành án DS)' },
    { code: 'TP12', name: 'Phòng 12 (Khiếu nại, tố cáo)' },
  ];

  for (const dept of departments) {
    const created = await prisma.department.upsert({
      where: { code: dept.code },
      update: {
        name: dept.name,
      },
      create: {
        code: dept.code,
        name: dept.name,
        shortName: dept.code,
      },
    });

    console.log(`✅ ${created.code} — ${created.name}`);
  }

  // Cập nhật managerId từ user role TRUONG_PHONG
  console.log('\n📋 Cập nhật managerId cho departments...');
  
  const allDepts = await prisma.department.findMany();
  
  for (const dept of allDepts) {
    const manager = await prisma.user.findFirst({
      where: {
        roomCode: dept.code,
        role: 'TRUONG_PHONG',
      },
    });

    if (manager) {
      await prisma.department.update({
        where: { id: dept.id },
        data: { managerId: manager.id },
      });
      console.log(`   ${dept.code} → Manager: ${manager.fullName}`);
    }
  }

  // Gán departmentId cho users
  console.log('\n📋 Gán departmentId cho users...');
  
  const allUsers = await prisma.user.findMany({
    where: { roomCode: { not: null } },
  });

  let updated = 0;
  for (const user of allUsers) {
    const dept = await prisma.department.findUnique({
      where: { code: user.roomCode },
    });

    if (dept) {
      await prisma.user.update({
        where: { id: user.id },
        data: { departmentId: dept.id },
      });
      updated++;
    }
  }

  console.log(`✅ Đã gán departmentId cho ${updated} users`);

  console.log('\n🎉 SEED DEPARTMENTS HOÀN THÀNH!');
  console.log('\n📌 Lưu ý: pvtManagerId sẽ được gán qua UI sau này.');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });