"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Package, Search } from "lucide-react";
import { loadAllProducts } from "../actions";
import { fuzzyScore } from "./fuzzy-search";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Product = Awaited<ReturnType<typeof loadAllProducts>>[number];

export default function ProductsPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadAllProducts()
      .then((results) => {
        if (!cancelled) setProducts(results);
      })
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить товары. Обновите страницу.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return products;

    return products
      .map((product) => ({
        product,
        score: fuzzyScore(product.name, normalizedQuery),
      }))
      .filter((entry): entry is { product: Product; score: number } => entry.score !== null)
      .sort((a, b) => a.score - b.score)
      .map(({ product }) => product);
  }, [products, query]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Товары</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Найдите товар по названию, даже если ввели его не полностью.
      </p>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Название товара"
          aria-label="Поиск товаров по названию"
          className="h-12 rounded-xl pl-12 text-base"
        />
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      <p role="status" className="mt-5 mb-3 text-sm text-muted-foreground">
        {loading ? "Загружаем товары…" : `Найдено: ${visibleProducts.length}`}
      </p>

      <div className="space-y-3">
        {!loading && visibleProducts.length === 0 && !error && (
          <Card className="rounded-2xl p-6 text-center text-muted-foreground">
            Ничего не найдено. Попробуйте изменить запрос.
          </Card>
        )}
        {visibleProducts.map((product) => (
          <Link key={product.id} href={`/products/${product.id}`} className="block">
            <Card className="flex-row items-center gap-3 rounded-2xl p-4 shadow-none transition-colors hover:bg-accent">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Package className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{product.name}</span>
                <span className="mt-1 flex flex-wrap gap-1.5">
                  {product.series.map((series) => (
                    <Badge key={series.id} variant="secondary" className="font-normal">
                      {series.name}
                    </Badge>
                  ))}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
