-- AlterTable
ALTER TABLE "push_subscriptions" ADD COLUMN     "is_guest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscription_type" TEXT NOT NULL DEFAULT 'ALL',
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "push_subscriptions_is_guest_idx" ON "push_subscriptions"("is_guest");
