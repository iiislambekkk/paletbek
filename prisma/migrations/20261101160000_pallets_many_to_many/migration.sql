-- Convert free-form pallet addresses into named pallets and product links.
CREATE TABLE "pallet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pallet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pallet_name_key" ON "pallet"("name");
CREATE INDEX "pallet_name_idx" ON "pallet"("name");

-- Preserve existing pallet locations as pallet names and keep their product links.
INSERT INTO "pallet" ("id", "name", "updatedAt")
SELECT 'pallet_' || md5("address"), "address", CURRENT_TIMESTAMP
FROM "pallet_location"
GROUP BY "address";

CREATE TABLE "pallet_product" (
    "productId" TEXT NOT NULL,
    "palletId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pallet_product_pkey" PRIMARY KEY ("productId", "palletId")
);

INSERT INTO "pallet_product" ("productId", "palletId", "createdAt")
SELECT "productId", 'pallet_' || md5("address"), MIN("createdAt")
FROM "pallet_location"
GROUP BY "productId", "address";

CREATE INDEX "pallet_product_palletId_idx" ON "pallet_product"("palletId");

ALTER TABLE "pallet_product" ADD CONSTRAINT "pallet_product_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pallet_product" ADD CONSTRAINT "pallet_product_palletId_fkey"
FOREIGN KEY ("palletId") REFERENCES "pallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE "pallet_location";
