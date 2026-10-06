-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "room_code" TEXT NOT NULL,
    "pvt_manager_id" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatches" (
    "id" TEXT NOT NULL,
    "so_cong_van" TEXT NOT NULL,
    "ngay_gui" DATE NOT NULL,
    "ngay_phat_hanh" DATE,
    "ten_cong_van" TEXT NOT NULL,
    "han_bao_cao_xu_ly" DATE NOT NULL,
    "thoi_han_xu_ly" TEXT,
    "don_vi_ban_hanh" TEXT NOT NULL,
    "nguoi_thuc_hien" TEXT,
    "ghiChu" TEXT,
    "trang_thai" TEXT NOT NULL DEFAULT 'DANG_XU_LY',
    "muc_do_khan" TEXT NOT NULL DEFAULT 'THUONG',
    "tien_do" INTEGER NOT NULL DEFAULT 0,
    "custom_fields" JSONB,
    "assigned_pvt_id" TEXT,
    "assigned_pvt_name" TEXT,
    "vt_chi_dao" TEXT,
    "assigned_tp_id" TEXT,
    "assigned_tp_name" TEXT,
    "pvt_chi_dao" TEXT,
    "bao_cao_tien_do" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "dispatch_id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "from_user_name" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "to_user_name" TEXT NOT NULL,
    "assign_level" TEXT NOT NULL,
    "chiDao" TEXT,
    "han_xu_ly" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "columns" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "width" TEXT,
    "options" JSONB,
    "description" TEXT,

    CONSTRAINT "columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "category" TEXT NOT NULL DEFAULT 'SYSTEM',
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_room_code_idx" ON "users"("room_code");

-- CreateIndex
CREATE INDEX "dispatches_trang_thai_idx" ON "dispatches"("trang_thai");

-- CreateIndex
CREATE INDEX "dispatches_han_bao_cao_xu_ly_idx" ON "dispatches"("han_bao_cao_xu_ly");

-- CreateIndex
CREATE INDEX "dispatches_assigned_pvt_id_idx" ON "dispatches"("assigned_pvt_id");

-- CreateIndex
CREATE INDEX "dispatches_assigned_tp_id_idx" ON "dispatches"("assigned_tp_id");

-- CreateIndex
CREATE INDEX "assignments_dispatch_id_idx" ON "assignments"("dispatch_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_dispatch_id_fkey" FOREIGN KEY ("dispatch_id") REFERENCES "dispatches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
