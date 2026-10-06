import { DatabaseSync } from 'node:sqlite';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const sqlitePath = path.resolve(__dirname, '../../data/database.sqlite');

console.log('📂 SQLite path:', sqlitePath);

const sqlite = new DatabaseSync(sqlitePath);

async function migrateUsers() {
  console.log('\n👥 Migrating users...');
  const users = sqlite.prepare('SELECT * FROM users').all();
  console.log(`Found ${users.length} users`);

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password || 'changeme', 10);
    
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        username: u.username,
        passwordHash: hashedPassword,
        fullName: u.fullName,
        role: u.role,
        roomCode: u.roomCode,
        pvtManagerId: u.pvtManagerId || null,
        phone: u.phone || null,
        email: u.email || null,
        active: u.active === 1,
        createdAt: new Date(u.createdAt),
      },
    });
  }
  console.log(`✅ Migrated ${users.length} users`);
}

async function migrateDispatches() {
  console.log('\n📄 Migrating dispatches...');
  const dispatches = sqlite.prepare('SELECT * FROM dispatches').all();
  console.log(`Found ${dispatches.length} dispatches`);

  for (const d of dispatches) {
    await prisma.dispatch.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        soCongVan: d.soCongVan,
        ngayGui: new Date(d.ngayGui),
        ngayPhatHanh: d.ngayPhatHanh ? new Date(d.ngayPhatHanh) : null,
        tenCongVan: d.tenCongVan,
        hanBaoCaoXuLy: new Date(d.hanBaoCaoXuLy),
        thoiHanXuLy: d.thoiHanXuLy || null,
        donViBanHanh: d.donViBanHanh,
        nguoiThucHien: d.nguoiThucHien || null,
        ghiChu: d.ghiChu || null,
        trangThai: d.trangThai || 'DANG_XU_LY',
        mucDoKhan: d.mucDoKhan || 'THUONG',
        tienDo: d.tienDo || 0,
        customFields: d.customFields ? JSON.parse(d.customFields) : {},
        assignedPvtId: d.assignedPvtId || null,
        assignedPvtName: d.assignedPvtName || null,
        vtChiDao: d.vtChiDao || null,
        assignedTpId: d.assignedTpId || null,
        assignedTpName: d.assignedTpName || null,
        pvtChiDao: d.pvtChiDao || null,
        baoCaoTienDo: d.baoCaoTienDo || null,
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(d.updatedAt),
      },
    });
  }
  console.log(`✅ Migrated ${dispatches.length} dispatches`);
}

async function migrateAssignments() {
  console.log('\n📋 Migrating assignments...');
  const assignments = sqlite.prepare('SELECT * FROM assignments').all();
  console.log(`Found ${assignments.length} assignments`);

  for (const a of assignments) {
    const dispatchExists = await prisma.dispatch.findUnique({
      where: { id: a.dispatchId },
    });
    
    if (!dispatchExists) {
      console.log(`⚠️  Skip assignment ${a.id} - dispatch not found`);
      continue;
    }

    await prisma.assignment.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        dispatchId: a.dispatchId,
        fromUserId: a.fromUserId,
        fromUserName: a.fromUserName,
        toUserId: a.toUserId,
        toUserName: a.toUserName,
        assignLevel: a.assignLevel,
        chiDao: a.chiDao || null,
        hanXuLy: a.hanXuLy ? new Date(a.hanXuLy) : null,
        createdAt: new Date(a.createdAt),
      },
    });
  }
  console.log(`✅ Migrated ${assignments.length} assignments`);
}

async function main() {
  try {
    console.log('🚀 Bắt đầu migrate SQLite → PostgreSQL...\n');
    
    await migrateUsers();
    await migrateDispatches();
    await migrateAssignments();
    
    console.log('\n========================================');
    console.log('✅ MIGRATE THÀNH CÔNG!');
    console.log('========================================');
  } catch (error) {
    console.error('\n❌ LỖI MIGRATE:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    sqlite.close();
  }
}

main();
