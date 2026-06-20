-- CreateTable
CREATE TABLE "report_links" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "report_links_token_key" ON "report_links"("token");
