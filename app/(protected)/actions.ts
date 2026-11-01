"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

const productSelect = {
  id: true,
  name: true,
  updatedAt: true,
  series: {
    select: {
      id: true,
      name: true,
      locations: { select: { pallet: { select: { id: true, name: true } } }, orderBy: { pallet: { name: "asc" as const } } },
    },
    orderBy: { name: "asc" as const },
  },
} satisfies Prisma.ProductSelect;

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Необходим вход в аккаунт.");
}

type SelectedProduct = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

function serializeProduct(product: SelectedProduct) {
  return {
    id: product.id,
    name: product.name,
    series: product.series.map(({ id, name, locations }) => ({ id, name, locations: locations.map(({ pallet }) => pallet.name) })),
    locations: [...new Set(product.series.flatMap(({ locations }) => locations.map(({ pallet }) => pallet.name)))].sort(),
    updated: product.updatedAt.toISOString(),
  };
}

export async function loadWarehouseData() {
  await requireSession();
  const [products, productCount, locationCount, pallets] = await Promise.all([
    prisma.product.findMany({ select: productSelect, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.product.count(), prisma.palletProductSeries.count(),
    prisma.pallet.findMany({ select: { id: true, name: true, _count: { select: { series: true } } }, orderBy: { name: "asc" } }),
  ]);
  return { products: products.map(serializeProduct), productCount, locationCount, pallets: pallets.map(({ id, name, _count }) => ({ id, name, productCount: _count.series })) };
}

export async function searchProducts(query: string) {
  await requireSession();
  const normalizedQuery = query.trim();
  const products = await prisma.product.findMany({
    where: normalizedQuery ? { OR: [
      { name: { contains: normalizedQuery, mode: "insensitive" } },
      { series: { some: { name: { contains: normalizedQuery, mode: "insensitive" } } } },
      { series: { some: { locations: { some: { pallet: { name: { contains: normalizedQuery, mode: "insensitive" } } } } } } },
    ] } : {},
    select: productSelect, orderBy: { updatedAt: "desc" }, take: 100,
  });
  return products.map(serializeProduct);
}

type SeriesInput = { name: string; palletIds: string[] };

function normalizeSeries(seriesInput: SeriesInput[]) {
  const series = seriesInput.map(({ name, palletIds }) => ({ name: name.trim(), palletIds: [...new Set(palletIds)] })).filter(({ name }) => name);
  if (!series.length) throw new Error("Добавьте хотя бы одну серию товара.");
  const names = series.map(({ name }) => name.toLocaleLowerCase());
  if (new Set(names).size !== names.length) throw new Error("Названия серий одного товара должны отличаться.");
  return series;
}

function seriesCreateData(series: SeriesInput[]) {
  return series.map(({ name, palletIds }) => ({ name, locations: { create: palletIds.map((palletId) => ({ palletId })) } }));
}

export async function createProduct(input: { name: string; series: SeriesInput[] }) {
  await requireSession();
  const name = input.name.trim();
  const series = normalizeSeries(input.series);
  if (!name) throw new Error("Укажите название товара.");
  const product = await prisma.product.create({ data: { name, series: { create: seriesCreateData(series) } }, select: productSelect });
  return serializeProduct(product);
}

export async function updateProduct(input: { id: string; name: string; series: SeriesInput[] }) {
  await requireSession();
  const name = input.name.trim();
  const series = normalizeSeries(input.series);
  if (!input.id || !name) throw new Error("Укажите название товара.");
  const product = await prisma.$transaction(async (transaction) => {
    const existing = await transaction.productSeries.findMany({ where: { productId: input.id }, select: { id: true, name: true } });
    const retained = existing.filter(({ name: currentName }) => series.some((entry) => entry.name.toLocaleLowerCase() === currentName.toLocaleLowerCase())).map(({ id }) => id);
    await transaction.productSeries.deleteMany({ where: { productId: input.id, id: { notIn: retained } } });
    for (const entry of series) {
      const match = existing.find(({ name: currentName }) => currentName.toLocaleLowerCase() === entry.name.toLocaleLowerCase());
      if (match) {
        await transaction.productSeries.update({ where: { id: match.id }, data: { name: entry.name } });
        await transaction.palletProductSeries.deleteMany({ where: { seriesId: match.id, palletId: { notIn: entry.palletIds } } });
        await transaction.palletProductSeries.createMany({ data: entry.palletIds.map((palletId) => ({ seriesId: match.id, palletId })), skipDuplicates: true });
      } else {
        await transaction.productSeries.create({ data: { productId: input.id, name: entry.name, locations: { create: entry.palletIds.map((palletId) => ({ palletId })) } } });
      }
    }
    return transaction.product.update({ where: { id: input.id }, data: { name }, select: productSelect });
  });
  return serializeProduct(product);
}

export async function deleteProduct(id: string) {
  await requireSession();
  if (!id) throw new Error("Не указан товар для удаления.");
  await prisma.product.delete({ where: { id } });
}

export async function createPallet(nameInput: string) {
  await requireSession();
  const name = nameInput.trim();
  if (!name) throw new Error("Введите название палеты.");
  return prisma.pallet.upsert({ where: { name }, create: { name }, update: {}, select: { id: true, name: true } });
}

export async function loadPallet(id: string) {
  await requireSession();
  const pallet = await prisma.pallet.findUnique({ where: { id }, select: { id: true, name: true, series: { select: { series: { select: { id: true, name: true, product: { select: { id: true, name: true } } } } }, orderBy: { series: { product: { name: "asc" } } } } } });
  if (!pallet) return null;
  return { id: pallet.id, name: pallet.name, series: pallet.series.map(({ series }) => ({ id: series.id, name: series.name, product: series.product })) };
}

export async function searchProductsForPallet(query: string) {
  await requireSession();
  const normalizedQuery = query.trim();
  const products = await prisma.product.findMany({
    where: normalizedQuery ? { OR: [{ name: { contains: normalizedQuery, mode: "insensitive" } }, { series: { some: { name: { contains: normalizedQuery, mode: "insensitive" } } } }] } : {},
    select: { id: true, name: true, series: { select: { id: true, name: true }, orderBy: { name: "asc" } } }, orderBy: { name: "asc" }, take: 50,
  });
  return products.flatMap(({ id, name, series }) => series.map((entry) => ({ ...entry, productId: id, productName: name })));
}

export async function addSeriesToPallet(palletId: string, seriesId: string) {
  await requireSession();
  await prisma.palletProductSeries.upsert({ where: { seriesId_palletId: { seriesId, palletId } }, create: { seriesId, palletId }, update: {} });
}

export async function removeSeriesFromPallet(palletId: string, seriesId: string) {
  await requireSession();
  await prisma.palletProductSeries.deleteMany({ where: { seriesId, palletId } });
}
