"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, Boxes, Check, CircleHelp, Command as CommandIcon, MapPin, Package, PackagePlus, Plus, Search, Trash2, Warehouse, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { createPallet, createProduct, deleteProduct, loadWarehouseData, searchProducts, updateProduct } from "./actions";

type ProductSeries = { id?: string; name: string; locations: string[] };
type Product = { id: string; name: string; series: ProductSeries[]; locations: string[]; updated: string };
type Pallet = { id: string; name: string; productCount: number };
type EditableSeries = { id?: string; name: string; palletIds: string[] };

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [locationCount, setLocationCount] = useState(0);
  const [query, setQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<EditableSeries[]>([]);
  const [activeSeriesIndex, setActiveSeriesIndex] = useState(0);
  const [newPalletParts, setNewPalletParts] = useState(["", "", "", ""]);
  const [palletPickerOpen, setPalletPickerOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadWarehouseData().then((data) => {
      if (cancelled) return;
      setProducts(data.products); setPallets(data.pallets); setProductCount(data.productCount); setLocationCount(data.locationCount);
    }).catch(() => { if (!cancelled) setError("Не удалось загрузить данные склада. Обновите страницу и попробуйте снова."); }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => { searchProducts(query).then(setProducts).catch(() => setError("Не удалось выполнить поиск.")); }, query ? 250 : 0);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const filteredProducts = useMemo(() => products.filter((product) => `${product.name} ${product.series.map((item) => item.name).join(" ")} ${product.locations.join(" ")}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [products, query]);

  function openProductForm(product: Product | null) {
    setEditingProduct(product); setEditingSeries(product ? product.series.map(({ id, name, locations }) => ({ id, name, palletIds: pallets.filter((pallet) => locations.includes(pallet.name)).map(({ id }) => id) })) : [{ name: "", palletIds: [] }]);
    setActiveSeriesIndex(0);
    setNewPalletParts(["", "", "", ""]); setError(""); setIsAdding(true);
  }

  async function addPalletToProduct() {
    if (newPalletParts.some((part) => !part)) { setError("Заполните все четыре части адреса палеты."); return; }
    const [row, level, section, number] = newPalletParts;
    const name = `P-${row}-${level}-${Number(section)}/${number}`;
    try {
      const pallet = await createPallet(name);
      setPallets((current) => current.some((item) => item.id === pallet.id) ? current : [...current, { ...pallet, productCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      setEditingSeries((current) => current.map((series, index) => index === activeSeriesIndex ? { ...series, palletIds: series.palletIds.includes(pallet.id) ? series.palletIds : [...series.palletIds, pallet.id] } : series));
      setNewPalletParts(["", "", "", ""]); setPalletPickerOpen(false); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось создать палету."); }
  }

  async function removeProduct() {
    if (!editingProduct) return;
    try {
      await deleteProduct(editingProduct.id);
      setProducts((current) => current.filter((product) => product.id !== editingProduct.id));
      setProductCount((count) => Math.max(0, count - 1));
      setLocationCount((count) => Math.max(0, count - editingProduct.series.reduce((sum, series) => sum + series.locations.length, 0)));
      setPallets((current) => current.map((pallet) => ({ ...pallet, productCount: Math.max(0, pallet.productCount - editingProduct.series.filter((series) => series.locations.includes(pallet.name)).length) })));
      setIsDeleteConfirmationOpen(false);
      setIsAdding(false);
      setEditingProduct(null);
      setError("");
      setNotice(`«${editingProduct.name}» удалён`);
      window.setTimeout(() => setNotice(""), 3000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось удалить товар.");
    }
  }
  async function submitProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const series = editingSeries.map(({ id, name: seriesName, palletIds }) => ({ ...(id ? { id } : {}), name: seriesName, palletIds }));
    try {
      const product = editingProduct ? await updateProduct({ id: editingProduct.id, name, series }) : await createProduct({ name, series });
      setProducts((current) => [product, ...current.filter((item) => item.id !== product.id)]);
      if (!editingProduct) setProductCount((count) => count + 1);
      const oldSeries = editingProduct?.series ?? [];
      const newLinks = product.series.reduce((sum, item) => sum + item.locations.length, 0);
      const oldLinks = oldSeries.reduce((sum, item) => sum + item.locations.length, 0);
      setLocationCount((count) => count + newLinks - oldLinks);
      setPallets((current) => current.map((pallet) => {
        const oldCount = oldSeries.filter((item) => item.locations.includes(pallet.name)).length;
        const newCount = product.series.filter((item) => item.locations.includes(pallet.name)).length;
        return { ...pallet, productCount: Math.max(0, pallet.productCount + newCount - oldCount) };
      }));
      setIsAdding(false); setEditingProduct(null); setError(""); setNotice(`«${product.name}» сохранён`); window.setTimeout(() => setNotice(""), 3000);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось сохранить товар."); }
  }

  const activeSeries = editingSeries[activeSeriesIndex];
  const selectedPallets = pallets.filter((pallet) => activeSeries?.palletIds.includes(pallet.id));
  const palletParts = pallets.map((pallet) => /^P-(\d+)-(\d+)-(\d+)\/(\d+)$/.exec(pallet.name)).filter((match): match is RegExpExecArray => match !== null);
  const rows = [...new Set(palletParts.map((match) => match[1]))].sort((a, b) => Number(a) - Number(b));
  const levels = [...new Set(palletParts.filter((match) => match[1] === newPalletParts[0]).map((match) => match[2]))].sort((a, b) => Number(a) - Number(b));
  const sections = [...new Set(palletParts.filter((match) => match[1] === newPalletParts[0] && match[2] === newPalletParts[1]).map((match) => match[3]))].sort((a, b) => Number(a) - Number(b));
  const numbers = [...new Set(palletParts.filter((match) => match[1] === newPalletParts[0] && match[2] === newPalletParts[1] && match[3] === newPalletParts[2]).map((match) => match[4]))].sort((a, b) => Number(a) - Number(b));

  return <SidebarProvider defaultOpen><AppSidebar /><SidebarInset className="min-h-svh bg-muted/30">
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:h-[72px] lg:px-10"><div className="flex items-center gap-2"><SidebarTrigger className="size-9" /><div className="flex items-center gap-2 text-sm text-muted-foreground"><Warehouse className="hidden size-4 sm:block" />Главная <span className="text-border">/</span><span className="text-foreground">Обзор склада</span></div></div><div className="flex items-center gap-2"><span className="hidden items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground sm:flex"><span className="size-1.5 rounded-full bg-primary" />Склад активен</span><ThemeToggle className="size-9 rounded-full" /><Button variant="outline" size="icon" className="size-9 rounded-full" aria-label="Справка"><CircleHelp className="size-4" /></Button></div></header>
    <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-7 sm:px-6 sm:pt-9 lg:px-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-muted-foreground">Фармацевтический склад</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Обзор склада</h1><p className="mt-2 text-sm text-muted-foreground">Найдите товар и сразу узнайте, на каких палетах он хранится.</p></div><Button onClick={() => openProductForm(null)} className="h-10 rounded-xl"><Plus className="size-4" />Добавить товар</Button></div>
      <section aria-label="Сводка склада" className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-3"><Card className="gap-3 rounded-2xl p-4 shadow-none sm:p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Товаров в каталоге</span><Package className="size-4 text-muted-foreground" /></div><p className="text-2xl font-semibold">{isLoading ? "—" : productCount.toLocaleString("ru-RU")}</p><p className="text-xs text-muted-foreground">Всего в базе</p></Card><Card className="gap-3 rounded-2xl p-4 shadow-none sm:p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Палет с товарами</span><Boxes className="size-4 text-muted-foreground" /></div><p className="text-2xl font-semibold">{isLoading ? "—" : pallets.length.toLocaleString("ru-RU")}</p><p className="text-xs text-muted-foreground">Связей товара с палетами: {locationCount}</p></Card><Card className="col-span-2 gap-3 rounded-2xl p-4 shadow-none sm:p-5 lg:col-span-1"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Показано в списке</span><Check className="size-4 text-muted-foreground" /></div><p className="text-2xl font-semibold">{filteredProducts.length} товаров</p><p className="text-xs text-muted-foreground">Результаты поиска</p></Card></section>
      {error && !isAdding && <p role="alert" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
      <section id="products" className="mt-8 scroll-mt-24"><div className="mb-4"><h2 className="text-lg font-semibold">Поиск по складу</h2><p className="mt-1 text-sm text-muted-foreground">По названию, серии или названию палеты</p></div><div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например, парацетамол или P-1-2-3/1" aria-label="Поиск товаров" className="h-14 rounded-2xl bg-background pl-12 pr-14 text-base shadow-sm sm:h-16 sm:text-lg" />{query ? <Button variant="ghost" size="icon" onClick={() => setQuery("")} aria-label="Очистить поиск" className="absolute right-2 top-1/2 size-9 -translate-y-1/2"><X className="size-4" /></Button> : <kbd className="absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border bg-muted px-2 py-1 text-xs text-muted-foreground sm:flex"><CommandIcon className="size-3" /> K</kbd>}</div></section>
      <section className="mt-8"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">{query ? "Результаты поиска" : "Недавно обновлённые"}</h2><p className="mt-1 text-sm text-muted-foreground">{filteredProducts.length} товаров</p></div><Button variant="outline" className="hidden h-9 rounded-lg sm:inline-flex"><ArrowDownUp className="size-4" />Сначала новые</Button></div>
        <div className="mt-4 space-y-3">{filteredProducts.length ? filteredProducts.map((product) => <Card key={product.id} className="gap-0 overflow-hidden rounded-2xl py-0 shadow-none transition-shadow hover:shadow-sm"><div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:px-5 sm:py-4"><div className="flex min-w-0 flex-1 items-start gap-3"><span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Package className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium leading-6">{product.name}</h3><Badge variant="secondary" className="font-normal text-muted-foreground">{product.series.length} сер.</Badge></div><div className="mt-2 space-y-2">{product.series.map((series) => <div key={series.id ?? series.name} className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="font-normal">Серия: {series.name}</Badge>{series.locations.map((location) => { const pallet = pallets.find((item) => item.name === location); return <Link key={`${series.id}-${location}`} href={pallet ? `/pallets/${pallet.id}` : "#"} className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-background px-2.5 font-mono text-xs font-medium"><MapPin className="size-3 text-primary" />{location}</Link>; })}{!series.locations.length && <span className="text-xs text-muted-foreground">Без палеты</span>}</div>)}</div></div></div><Separator className="sm:hidden" /><Button variant="ghost" size="icon" onClick={() => openProductForm(product)} className="size-9 shrink-0 rounded-lg text-muted-foreground" aria-label={`Изменить ${product.name}`}><ArrowDownUp className="size-4" /></Button><p className="text-xs text-muted-foreground sm:hidden">Обновлено: {new Date(product.updated).toLocaleString("ru-RU")}</p></div></Card>) : <Card className="flex flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center shadow-none"><span className="flex size-12 items-center justify-center rounded-2xl bg-muted"><Search className="size-5 text-muted-foreground" /></span><div><h3 className="font-medium">{isLoading ? "Загружаем товары…" : "Ничего не найдено"}</h3><p className="mt-1 text-sm text-muted-foreground">Попробуйте изменить поисковый запрос.</p></div>{!isLoading && <Button variant="outline" onClick={() => setQuery("")} className="rounded-lg">Сбросить поиск</Button>}</Card>}</div>
      </section>
      <section id="pallets" className="mt-10"><div><h2 className="text-lg font-semibold">Палеты</h2><p className="mt-1 text-sm text-muted-foreground">Откройте палету, чтобы посмотреть и изменить её содержимое.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{pallets.map((pallet) => <Link key={pallet.id} href={`/pallets/${pallet.id}`}><Card className="flex-row items-center gap-3 rounded-2xl p-4 shadow-none transition-colors hover:bg-accent"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Boxes className="size-5" /></span><span className="min-w-0 flex-1"><span className="block truncate font-medium">{pallet.name}</span><span className="text-sm text-muted-foreground">{pallet.productCount} товаров</span></span></Card></Link>)}</div></section>
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-5 text-xs text-muted-foreground"><span>Палетбек · Учёт товаров и палет</span><span>Палет: {pallets.length}</span></footer>
    </main>
    <AlertDialog open={isDeleteConfirmationOpen} onOpenChange={setIsDeleteConfirmationOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить товар?</AlertDialogTitle>
          <AlertDialogDescription>
            Товар «{editingProduct?.name}» и его связи с палетами будут удалены. Это действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => void removeProduct()}>
            Удалить товар
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>    {notice && <div role="status" className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg lg:bottom-6">{notice}</div>}
    {isAdding && <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) { setIsAdding(false); setEditingProduct(null); } }}><section role="dialog" aria-modal="true" aria-labelledby="add-product-title" className="max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-3xl border bg-background p-5 shadow-2xl sm:rounded-2xl sm:p-6">
      <div className="mb-6 flex items-start justify-between"><div><span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><PackagePlus className="size-5" /></span><h2 id="add-product-title" className="text-xl font-semibold">{editingProduct ? "Изменить товар" : "Новый товар"}</h2><p className="mt-1 text-sm text-muted-foreground">Укажите товар, серию и одну или несколько палет.</p></div><Button variant="ghost" size="icon" onClick={() => { setIsAdding(false); setEditingProduct(null); }} aria-label="Закрыть"><X className="size-4" /></Button></div>
      <form onSubmit={submitProduct} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="product-name">Название товара</Label><Input id="product-name" name="name" defaultValue={editingProduct?.name} placeholder="Например, Парацетамол, таблетки 500 мг" required autoFocus className="h-11 rounded-xl" /></div>
        <div className="space-y-3"><div className="flex items-center justify-between"><Label>Серии и палеты</Label><Button type="button" variant="outline" size="sm" className="h-8 rounded-lg" onClick={() => setEditingSeries((current) => [...current, { name: "", palletIds: [] }])}><Plus className="size-3.5" />Добавить серию</Button></div>
          {editingSeries.map((series, index) => <Card key={series.id ?? `new-${index}`} className="space-y-3 rounded-xl p-3 shadow-none"><div className="flex items-center gap-2"><Input value={series.name} onChange={(event) => setEditingSeries((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} placeholder="Номер серии" aria-label={`Серия ${index + 1}`} required className="h-10 rounded-lg" />{editingSeries.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label={`Удалить серию ${index + 1}`} onClick={() => setEditingSeries((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X className="size-4" /></Button>}</div>
            <div className="flex flex-wrap gap-2">{pallets.filter((pallet) => series.palletIds.includes(pallet.id)).map((pallet) => <Badge key={pallet.id} variant="secondary" className="gap-1.5 py-1">{pallet.name}<button type="button" onClick={() => setEditingSeries((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, palletIds: item.palletIds.filter((id) => id !== pallet.id) } : item))} aria-label={`Убрать палету ${pallet.name}`}><X className="size-3" /></button></Badge>)}</div>
            <Popover open={palletPickerOpen && activeSeriesIndex === index} onOpenChange={(open) => { setActiveSeriesIndex(index); setPalletPickerOpen(open); }}><PopoverTrigger render={<Button type="button" variant="outline" className="h-9 w-full justify-between rounded-lg font-normal" />}><span>Выбрать палету{series.palletIds.length ? ` · ${series.palletIds.length}` : ""}</span><Search className="size-4 text-muted-foreground" /></PopoverTrigger><PopoverContent align="start" className="w-[var(--anchor-width)] p-3"><div className="space-y-3"><div className="flex items-center justify-between gap-2"><Label>Существующие палеты</Label><select aria-label="Выбрать палету" className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm" value="" onChange={(event) => { const id = event.target.value; if (id) setEditingSeries((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, palletIds: [...new Set([...item.palletIds, id])] } : item)); }}><option value="">Выбрать…</option>{pallets.filter((pallet) => !series.palletIds.includes(pallet.id)).map((pallet) => <option key={pallet.id} value={pallet.id}>{pallet.name}</option>)}</select></div>
              <div className="flex flex-col items-center gap-3 rounded-xl border bg-muted/30 px-3 py-4"><div className="flex w-full items-center justify-center gap-1.5 sm:gap-2"><span className="font-mono text-lg font-semibold text-muted-foreground">P-</span><InputOTP maxLength={5} inputMode="numeric" pattern="^[0-9]+$" value={newPalletParts.join("")} onChange={(value) => { const digits = value.replace(/\D/g, "").slice(0, 5); setNewPalletParts([digits.slice(0, 1), digits.slice(1, 2), digits.slice(2, 4), digits.slice(4, 5)]); }} pasteTransformer={(pasted) => pasted.replace(/\D/g, "").slice(0, 5)} aria-label="Адрес палеты"><InputOTPGroup className="gap-0"><InputOTPSlot index={0} className="size-11 rounded-lg border text-base font-semibold" /></InputOTPGroup><span className="px-1 font-mono text-lg text-muted-foreground">-</span><InputOTPGroup className="gap-0"><InputOTPSlot index={1} className="size-11 rounded-lg border text-base font-semibold" /></InputOTPGroup><span className="px-1 font-mono text-lg text-muted-foreground">-</span><InputOTPGroup className="gap-0"><InputOTPSlot index={2} className="size-11 rounded-l-lg border-y border-l text-base font-semibold" /><InputOTPSlot index={3} className="size-11 rounded-r-lg border text-base font-semibold" /></InputOTPGroup><span className="px-1 font-mono text-lg text-muted-foreground">/</span><InputOTPGroup className="gap-0"><InputOTPSlot index={4} className="size-11 rounded-lg border text-base font-semibold" /></InputOTPGroup></InputOTP></div><p className="font-mono text-sm font-medium">P-{newPalletParts[0] || "_"}-{newPalletParts[1] || "_"}-{newPalletParts[2] ? String(Number(newPalletParts[2])) : "__"}/{newPalletParts[3] || "_"}</p></div>
              {newPalletParts.every(Boolean) && (() => { const palletName = `P-${newPalletParts[0]}-${newPalletParts[1]}-${Number(newPalletParts[2])}/${newPalletParts[3]}`; const match = pallets.find((pallet) => pallet.name === palletName); return <Button type="button" className="w-full rounded-lg" onClick={() => match ? (setEditingSeries((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, palletIds: [...new Set([...item.palletIds, match.id])] } : item)), setNewPalletParts(["", "", "", ""]), setPalletPickerOpen(false)) : void addPalletToProduct()}><Plus className="size-4" />{match ? `Добавить палету ${match.name}` : `Создать и добавить ${palletName}`}</Button>; })()}</div></PopoverContent></Popover>
          </Card>)}
        </div>        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">{editingProduct ? <Button type="button" variant="destructive" onClick={() => setIsDeleteConfirmationOpen(true)} className="h-10 rounded-xl"><Trash2 className="size-4" />Удалить товар</Button> : <span />}<div className="flex flex-col-reverse gap-2 sm:flex-row"><Button type="button" variant="outline" onClick={() => { setIsAdding(false); setEditingProduct(null); }} className="h-10 rounded-xl">Отмена</Button><Button type="submit" className="h-10 rounded-xl"><Plus className="size-4" />{editingProduct ? "Сохранить изменения" : "Добавить товар"}</Button></div></div>
      </form>
    </section></div>}
  </SidebarInset></SidebarProvider>;
}
