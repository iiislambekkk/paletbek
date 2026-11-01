-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pallet_location" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pallet_location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_name_idx" ON "product"("name");

-- CreateIndex
CREATE INDEX "product_series_idx" ON "product"("series");

-- CreateIndex
CREATE INDEX "pallet_location_address_idx" ON "pallet_location"("address");

-- CreateIndex
CREATE INDEX "pallet_location_productId_idx" ON "pallet_location"("productId");

-- AddForeignKey
ALTER TABLE "pallet_location" ADD CONSTRAINT "pallet_location_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
