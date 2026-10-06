import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed data...');

  // ============================================
  // 1. TẠO 40 PERMISSIONS
  // ============================================
  console.log('📋 Tạo 40 permissions...');

  const permissions = [
    // USER (1-10)
    { code: 'user:view:all', name: 'Xem tất cả user', module: 'user', action: 'view', scope: 'all' },
    { code: 'user:view:department', name: 'Xem user phòng mình', module: 'user', action: 'view', scope: 'department' },
    { code: 'user:view:own', name: 'Xem user của mình', module: 'user', action: 'view', scope: 'own' },
    { code: 'user:create', name: 'Tạo tài khoản', module: 'user', action: 'create' },
    { code: 'user:update:all', name: 'Sửa mọi user', module: 'user', action: 'update', scope: 'all' },
    { code: 'user:update:own', name: 'Sửa user của mình', module: 'user', action: 'update', scope: 'own' },
    { code: 'user:delete', name: 'Xóa user', module: 'user', action: 'delete' },
    { code: 'user:reset-password', name: 'Reset mật khẩu', module: 'user', action: 'reset-password' },
    { code: 'user:assign-role', name: 'Gán role', module: 'user', action: 'assign-role' },
    { code: 'user:assign-permission', name: 'Gán permission', module: 'user', action: 'assign-permission' },

    // DISPATCH (11-20)
    { code: 'dispatch:view:all', name: 'Xem tất cả CV', module: 'dispatch', action: 'view', scope: 'all' },
    { code: 'dispatch:view:department', name: 'Xem CV phòng', module: 'dispatch', action: 'view', scope: 'department' },
    { code: 'dispatch:view:assigned', name: 'Xem CV được giao', module: 'dispatch', action: 'view', scope: 'assigned' },
    { code: 'dispatch:view:own', name: 'Xem CV của mình', module: 'dispatch', action: 'view', scope: 'own' },
    { code: 'dispatch:create', name: 'Tạo CV', module: 'dispatch', action: 'create' },
    { code: 'dispatch:update:all', name: 'Sửa mọi CV', module: 'dispatch', action: 'update', scope: 'all' },
    { code: 'dispatch:update:assigned', name: 'Sửa CV được giao', module: 'dispatch', action: 'update', scope: 'assigned' },
    { code: 'dispatch:delete', name: 'Xóa CV', module: 'dispatch', action: 'delete' },
    { code: 'dispatch:export', name: 'Xuất Excel/PDF', module: 'dispatch', action: 'export' },
    { code: 'dispatch:import', name: 'Nhập từ Excel', module: 'dispatch', action: 'import' },

    // ASSIGNMENT (21-30)
    { code: 'assignment:assign:pvt', name: 'VT giao PVT', module: 'assignment', action: 'assign-pvt' },
    { code: 'assignment:assign:tp', name: 'PVT giao TP', module: 'assignment', action: 'assign-tp' },
    { code: 'assignment:number', name: 'Đánh số CV', module: 'assignment', action: 'number' },
    { code: 'assignment:submit:pvt', name: 'TP gửi PVT', module: 'assignment', action: 'submit-pvt' },
    { code: 'assignment:submit:vt', name: 'PVT trình VT', module: 'assignment', action: 'submit-vt' },
    { code: 'assignment:agree', name: 'Đồng ý', module: 'assignment', action: 'agree' },
    { code: 'assignment:disagree', name: 'Không đồng ý', module: 'assignment', action: 'disagree' },
    { code: 'assignment:reassign', name: 'Giao lại', module: 'assignment', action: 'reassign' },
    { code: 'assignment:delegate', name: 'Ủy quyền', module: 'assignment', action: 'delegate' },
    { code: 'assignment:recall', name: 'Thu hồi', module: 'assignment', action: 'recall' },

    // REPORT (31-35)
    { code: 'report:view:all', name: 'Xem tất cả báo cáo', module: 'report', action: 'view', scope: 'all' },
    { code: 'report:view:department', name: 'Xem báo cáo phòng', module: 'report', action: 'view', scope: 'department' },
    { code: 'report:view:own', name: 'Xem báo cáo mình', module: 'report', action: 'view', scope: 'own' },
    { code: 'report:create', name: 'Tạo báo cáo', module: 'report', action: 'create' },
    { code: 'report:export', name: 'Xuất báo cáo', module: 'report', action: 'export' },

    // STATS (36-38)
    { code: 'stats:view:all', name: 'Xem thống kê toàn viện', module: 'stats', action: 'view', scope: 'all' },
    { code: 'stats:view:department', name: 'Xem thống kê phòng', module: 'stats', action: 'view', scope: 'department' },
    { code: 'stats:export', name: 'Xuất thống kê', module: 'stats', action: 'export' },

    // ADMIN (39-40)
    { code: 'admin:database:view', name: 'Xem database', module: 'admin', action: 'database-view' },
    { code: 'admin:audit-logs:view', name: 'Xem nhật ký', module: 'admin', action: 'audit-logs-view' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: { ...perm, isSystem: true },
    });
  }

  console.log(`✅ Đã tạo ${permissions.length} permissions`);

  // ============================================
  // 2. TẠO 4 ROLES
  // ============================================
  console.log('📋 Tạo 4 roles...');

  const roles = [
    { id: 1, code: 'ADMIN', name: 'Quản trị viên', description: 'Quản trị hệ thống', level: 0, isSystem: true },
    { id: 2, code: 'VIEN_TRUONG', name: 'Viện trưởng', description: 'Thủ trưởng đơn vị', level: 1, isSystem: true },
    { id: 3, code: 'PHO_VIEN_TRUONG', name: 'Phó Viện trưởng', description: 'Phó thủ trưởng', level: 2, isSystem: true },
    { id: 4, code: 'TRUONG_PHONG', name: 'Trưởng phòng', description: 'Trưởng phòng nghiệp vụ', level: 3, isSystem: true },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: role,
    });
  }

  console.log(`✅ Đã tạo ${roles.length} roles`);

  // ============================================
  // 3. GÁN PERMISSIONS CHO ROLES
  // ============================================
  console.log('📋 Gán permissions cho roles...');

  // ROLE 1: ADMIN — tất cả 40 permissions
  const allPerms = await prisma.permission.findMany();
  for (const p of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: 1, permissionId: p.id } },
      update: {},
      create: { roleId: 1, permissionId: p.id },
    });
  }

  // ROLE 2: VIEN_TRUONG
const vienTruongPerms = [
  'user:view:all', 'user:view:own', 'user:create', 'user:update:all', 'user:delete', 'user:assign-role',

  'dispatch:view:all', 'dispatch:create', 'dispatch:update:all', 'dispatch:delete',
  'dispatch:export', 'dispatch:import',

  'assignment:assign:pvt',
  'assignment:assign:tp',           // ⭐ THÊM DÒNG NÀY
  'assignment:agree', 'assignment:disagree',
  'assignment:reassign', 'assignment:delegate',

  'report:view:all', 'report:export',
  'stats:view:all', 'stats:export',

  'admin:database:view', 'admin:audit-logs:view',
];

  for (const code of vienTruongPerms) {
    const perm = await prisma.permission.findUnique({ where: { code } });
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: 2, permissionId: perm.id } },
        update: {},
        create: { roleId: 2, permissionId: perm.id },
      });
    }
  }

  // ROLE 3: PHO_VIEN_TRUONG
  const pvtPerms = [
    'user:view:own',
    'dispatch:view:department', 'dispatch:view:assigned', 'dispatch:update:assigned', 'dispatch:export',
    'assignment:assign:tp', 'assignment:submit:vt', 'assignment:agree', 'assignment:disagree', 'assignment:reassign',
    'report:view:department', 'report:export',
    'stats:view:department', 'stats:export',
    'admin:database:view',
  ];

  for (const code of pvtPerms) {
    const perm = await prisma.permission.findUnique({ where: { code } });
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: 3, permissionId: perm.id } },
        update: {},
        create: { roleId: 3, permissionId: perm.id },
      });
    }
  }

  // ROLE 4: TRUONG_PHONG
  const tpPerms = [
    'user:view:own',
    'dispatch:view:assigned', 'dispatch:view:own', 'dispatch:update:assigned', 'dispatch:export',
    'assignment:number', 'assignment:submit:pvt',
    'report:view:own', 'report:create', 'report:export',
    'stats:view:department', 'stats:export',
  ];

  for (const code of tpPerms) {
    const perm = await prisma.permission.findUnique({ where: { code } });
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: 4, permissionId: perm.id } },
        update: {},
        create: { roleId: 4, permissionId: perm.id },
      });
    }
  }

  console.log('✅ Đã gán permissions cho 4 roles');

  // ============================================
  // 4. MIGRATE ROLE CŨ → USER_ROLES
  // ============================================
  console.log('📋 Migrate role cũ → user_roles...');

  const users = await prisma.user.findMany({
    where: { role: { not: null } },
  });

  for (const user of users) {
    // Map role cũ → role ID mới
    const roleMap = {
      'ADMIN': 1,
      'VIEN_TRUONG': 2,
      'PHO_VIEN_TRUONG': 3,
      'TRUONG_PHONG': 4,
    };

    const roleId = roleMap[user.role];
    if (roleId) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId } },
        update: {},
        create: { userId: user.id, roleId, assignedBy: 'system' },
      });
    }
  }

  console.log(`✅ Đã migrate ${users.length} users`);

  console.log('\n🎉 SEED DATA HOÀN THÀNH!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });