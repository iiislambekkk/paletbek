"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, MapPin, Package, Pencil, Search } from "lucide-react";
import { loadAllProducts } from "../actions";
import { fuzzyScore } from "./fuzzy-search";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
          <Card key={product.id} className="gap-0 overflow-hidden rounded-2xl p-0 shadow-none">
            <div className="flex items-start gap-3 p-4 pb-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Package className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words text-lg font-semibold leading-snug">{product.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Серий: {product.series.length}</p>
              </div>
              <Link href={`/products/${product.id}`} aria-label={`Редактировать ${product.name}`} className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-accent">
                <Pencil className="size-4" />
              </Link>
            </div>
            <div className="space-y-1 px-3 pb-3">
              {product.series.map((series) => (
                <Collapsible key={series.id} className="group rounded-xl bg-muted/60">
                  <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                    <span className="min-w-0 flex-1 break-words font-medium">{series.name}</span>
                    <span className="text-xs text-muted-foreground">{series.locations.length} палет</span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    {series.locations.length ? (
                      <div className="flex flex-wrap gap-2">
                        {series.locations.map((location) => (
                          <span key={location} className="inline-flex items-center gap-1.5 rounded-lg bg-background px-3 py-2 font-mono text-sm font-medium text-foreground">
                            <MapPin className="size-3.5 text-primary" />{location}
                          </span>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground">Палеты не указаны</p>}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
