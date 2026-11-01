"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Boxes, MapPin, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getRecentlyViewed, type RecentItem } from "@/lib/recently-viewed";
import { loadWarehouseData } from "./actions";

type Summary = {
  productCount: number;
  locationCount: number;
  pallets: { id: string; name: string; productCount: number }[];
};

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<{ products: RecentItem[]; pallets: RecentItem[] }>({ products: [], pallets: [] });

  useEffect(() => {
    const recentTimer = window.setTimeout(() => setRecent(getRecentlyViewed()), 0);
    let cancelled = false;
    loadWarehouseData()
      .then(({ productCount, locationCount, pallets }) => {
        if (!cancelled) setSummary({ productCount, locationCount, pallets });
      })
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить обзор склада. Обновите страницу и попробуйте снова.");
      });
    return () => { cancelled = true; window.clearTimeout(recentTimer); };
  }, []);

  const occupied = summary?.pallets.filter((pallet) => pallet.productCount > 0).length;
  const statistics = [
    { label: "Товаров в каталоге", value: summary?.productCount, icon: Package },
    { label: "Палет с товарами", value: occupied, icon: Boxes },
    { label: "Размещений серий", value: summary?.locationCount, icon: MapPin },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-7 sm:px-6 sm:pt-9 lg:px-10">
      <p className="text-sm text-muted-foreground">Фармацевтический склад</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Обзор склада</h1>
      <p className="mt-2 text-sm text-muted-foreground">Основные показатели и быстрый доступ к складу.</p>

      {error && <p role="alert" className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}

      <section aria-label="Статистика склада" className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {statistics.map(({ label, value, icon: Icon }, index) => (
          <Card key={label} className={`gap-3 rounded-2xl p-4 shadow-none sm:p-5 ${index === 2 ? "col-span-2 lg:col-span-1" : ""}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className="size-4 shrink-0 text-muted-foreground" />
            </div>
            <p className="text-2xl font-semibold">{value === undefined ? "—" : value.toLocaleString("ru-RU")}</p>
          </Card>
        ))}
      </section>

      <section aria-label="Быстрый переход" className="mt-8 grid gap-3 sm:grid-cols-2">
        {[
          { href: "/products", title: "Найти товар", description: "Поиск по названию и серии", icon: Package },
          { href: "/pallets", title: "Найти палету", description: "Поиск по адресу хранения", icon: Boxes },
        ].map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="flex min-h-36 items-center gap-4 rounded-2xl border bg-card p-5 text-card-foreground shadow-none transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-6" /></span>
            <span className="min-w-0 flex-1"><span className="block text-lg font-semibold">{title}</span><span className="mt-1 block text-sm text-muted-foreground">{description}</span></span>
            <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </section>

      <section aria-label="Последние просмотры" className="mt-8 grid gap-6 sm:grid-cols-2">
        {[
          { title: "Недавние товары", href: "/products", items: recent.products },
          { title: "Недавние палеты", href: "/pallets", items: recent.pallets },
        ].map(({ title, href, items }) => (
          <div key={href}>
            <h2 className="text-lg font-semibold">{title}</h2>
            <Card className="mt-3 gap-0 overflow-hidden rounded-2xl py-0 shadow-none">
              {items.length ? items.map((item) => (
                <Link key={item.id} href={`${href}/${item.id}`} className="flex min-h-12 items-center justify-between gap-3 border-b px-4 py-3 text-sm font-medium last:border-b-0 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
                  <span className="truncate">{item.name}</span><ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              )) : <p className="px-4 py-5 text-sm text-muted-foreground">Пока нет просмотренных записей</p>}
            </Card>
          </div>
        ))}
      </section>
    </main>
  );
}
