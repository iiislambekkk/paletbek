-- Move the series identifier from product to its own entity and attach pallets to series.
CREATE TABLE "product_series" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_series_pkey" PRIMARY KEY ("id")
);

-- Keep every existing product, series name, and pallet association.
INSERT INTO "product_series" ("id", "name", "productId", "createdAt", "updatedAt")
SELECT 'series_' || md5(p."id"), p."series", p."id", p."createdAt", p."updatedAt"
FROM "product" p;

CREATE UNIQUE INDEX "product_series_productId_name_key" ON "product_series"("productId", "name");
CREATE INDEX "product_series_name_idx" ON "product_series"("name");
ALTER TABLE "product_series" ADD CONSTRAINT "product_series_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "pallet_product_series" (
    "seriesId" TEXT NOT NULL,
    "palletId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pallet_product_series_pkey" PRIMARY KEY ("seriesId", "palletId")
);

INSERT INTO "pallet_product_series" ("seriesId", "palletId", "createdAt")
SELECT 'series_' || md5(pp."productId"), pp."palletId", pp."createdAt"
FROM "pallet_product" pp;

CREATE INDEX "pallet_product_series_palletId_idx" ON "pallet_product_series"("palletId");
ALTER TABLE "pallet_product_series" ADD CONSTRAINT "pallet_product_series_seriesId_fkey"
FOREIGN KEY ("seriesId") REFERENCES "product_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pallet_product_series" ADD CONSTRAINT "pallet_product_series_palletId_fkey"
FOREIGN KEY ("palletId") REFERENCES "pallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE "pallet_product";
ALTER TABLE "product" DROP COLUMN "series";
DROP INDEX IF EXISTS "product_series_idx";
