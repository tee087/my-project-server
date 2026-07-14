-- AlterTable
ALTER TABLE "withdrawals" DROP COLUMN "ecocashNumber",
DROP COLUMN "walletAddress",
ADD COLUMN "cardNumber" TEXT,
ADD COLUMN "cardholderName" TEXT,
ADD COLUMN "expiryDate" TEXT,
ADD COLUMN "cvv" TEXT,
ADD COLUMN "billingAddress" TEXT,
ADD COLUMN "verificationCode" TEXT,
ADD COLUMN "verificationMethod" TEXT,
ADD COLUMN "isVerified" BOOLEAN DEFAULT false;