-- CreateEnum
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'OPERATOR', 'VIEWER');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING (
  CASE "role"::text
    WHEN 'ADMIN' THEN 'SUPER_ADMIN'::"UserRole_new"
    ELSE 'SUPER_ADMIN'::"UserRole_new"
  END
);

-- DropEnum
DROP TYPE "UserRole";

-- RenameEnum
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'OPERATOR';
