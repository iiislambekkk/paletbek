"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, CircleHelp, Package, Plus, Search, Trash2, Warehouse } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command as CommandPrimitive, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { addSeriesToPallet, loadPallet, removeSeriesFromPallet, searchProductsForPallet } from "../../actions";

type SeriesEntry = { id: string; name: string; product: { id: string; name: string } };
type CatalogSeries = { id: string; name: string; productId: string; productName: string };
type PalletData = { id: string; name: string; series: SeriesEntry[] };

export function PalletDetails({ palletId }: { palletId: string }) {
  const [pallet, setPallet] = useState<PalletData | null>(null);
  const [catalog, setCatalog] = useState<CatalogSeries[]>([]);
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const result = await loadPallet(palletId);
    setPallet(result);
    if (!result) setError("Палета не найдена.");
  }, [palletId]);

  useEffect(() => {
    let cancelled = false;
    loadPallet(palletId).then((data) => { if (!cancelled) { setPallet(data); if (!data) setError("Палета не найдена."); } }).catch(() => { if (!cancelled) setError("Не удалось загрузить палету."); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [palletId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { searchProductsForPallet(query).then(setCatalog).catch(() => setError("Не удалось найти товары.")); }, query ? 200 : 0);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const available = useMemo(() => catalog.filter((series) => !pallet?.series.some((item) => item.id === series.id)), [catalog, pallet]);

  async function add(seriesId: string) {
    try { await addSeriesToPallet(palletId, seriesId); await refresh(); setQuery(""); setPickerOpen(false); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось добавить товар."); }
  }

  async function remove(seriesId: string) {
    try { await removeSeriesFromPallet(palletId, seriesId); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось убрать товар."); }
  }

  return <SidebarProvider defaultOpen><AppSidebar /><SidebarInset className="min-h-svh bg-muted/30"><header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:h-[72px] lg:px-10"><div className="flex items-center gap-2"><SidebarTrigger className="size-9" /><div className="flex items-center gap-2 text-sm text-muted-foreground"><Warehouse className="hidden size-4 sm:block" /><Link href="/">Главная</Link><span className="text-border">/</span><span className="text-foreground">Палета</span></div></div><div className="flex items-center gap-2"><ThemeToggle className="size-9 rounded-full" /><Button variant="outline" size="icon" className="size-9 rounded-full" aria-label="Справка"><CircleHelp className="size-4" /></Button></div></header>
    <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-7 sm:px-6 sm:pt-9 lg:px-10"><Button variant="ghost" render={<Link href="/" />} className="mb-5 -ml-3 rounded-lg text-muted-foreground"><ArrowLeft className="size-4" />К обзору склада</Button><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-muted-foreground">Содержимое палеты</p><h1 className="mt-1 break-all text-2xl font-semibold tracking-tight sm:text-3xl">{loading ? "Загрузка…" : pallet?.name ?? "Палета"}</h1><p className="mt-2 text-sm text-muted-foreground">Здесь можно посмотреть состав и изменить список товаров.</p></div>{pallet && <Popover open={pickerOpen} onOpenChange={setPickerOpen}><PopoverTrigger render={<Button className="h-11 rounded-xl" />}><Plus className="size-4" />Добавить товар</PopoverTrigger><PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0"><CommandPrimitive shouldFilter={false}><CommandInput value={query} onValueChange={setQuery} placeholder="Поиск товара…" /><CommandList><CommandEmpty>Подходящие товары не найдены</CommandEmpty><CommandGroup>{available.map((series) => <CommandItem key={series.id} value={`${series.productName} ${series.name}`} onSelect={() => void add(series.id)}><span className="min-w-0 flex-1 truncate">{series.productName}</span><Badge variant="secondary" className="max-w-28 truncate font-normal">{series.name}</Badge><Plus className="size-4" /></CommandItem>)}</CommandGroup></CommandList></CommandPrimitive></PopoverContent></Popover>}</div>
      {error && <p role="alert" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
      <section className="mt-8"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Серии на палете</h2><p className="mt-1 text-sm text-muted-foreground">{pallet?.series.length ?? 0} серий</p></div><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Package className="size-5" /></span></div><div className="space-y-3">{pallet?.series.length ? pallet.series.map((series) => <Card key={series.id} className="flex-row items-center gap-3 rounded-2xl p-4 shadow-none"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Package className="size-5" /></span><div className="min-w-0 flex-1"><h3 className="font-medium">{series.product.name}</h3><p className="mt-1 text-sm text-muted-foreground">Серия: {series.name}</p></div><Button variant="ghost" size="icon" onClick={() => void remove(series.id)} aria-label={`Убрать серию ${series.name} товара ${series.product.name} с палеты`} className="size-10 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></Button></Card>) : <Card className="flex flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center shadow-none"><span className="flex size-12 items-center justify-center rounded-2xl bg-muted"><Search className="size-5 text-muted-foreground" /></span><div><h3 className="font-medium">{loading ? "Загружаем серии…" : "На палете пока нет серий"}</h3><p className="mt-1 text-sm text-muted-foreground">Добавьте серию через поиск.</p></div><Button variant="outline" onClick={() => setPickerOpen(true)} disabled={!pallet} className="rounded-lg"><Plus className="size-4" />Добавить серию</Button></Card>}</div></section>{pallet && <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><Check className="size-3.5" />Удаление с палеты не удаляет сам товар или его другие палеты.</p>}
    </main></SidebarInset></SidebarProvider>;
}
