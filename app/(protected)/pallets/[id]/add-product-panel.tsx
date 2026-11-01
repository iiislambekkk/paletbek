"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Pencil, Package, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { addSeriesToPallet, createProduct, createSeriesOnPallet, removeSeriesFromPallet, renameProductSeries, searchProductsForPallet } from "../../actions";

type CatalogSeries = { id: string; name: string; productId: string; productName: string };

export function AddProductPanel({ palletId, assignedIds, open, onOpenChange, onAdded, initialProduct }: {
  palletId: string;
  assignedIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => Promise<void>;
  initialProduct: { id: string; name: string } | null;
}) {
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<CatalogSeries[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string } | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newSeriesName, setNewSeriesName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingSeries, setEditingSeries] = useState<CatalogSeries | null>(null);
  const [editedName, setEditedName] = useState("");
  const [notice, setNotice] = useState("");
  const [seriesToRemove, setSeriesToRemove] = useState<CatalogSeries | null>(null);
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (initialProduct) {
      setSelectedProduct(initialProduct);
      setQuery(initialProduct.name);
    }
  }, [open, initialProduct]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const result = await searchProductsForPallet(query);
        if (active) setCatalog(result);
      } catch {
        if (active) setError("Не удалось загрузить товары.");
      } finally {
        if (active) setSearching(false);
      }
    }, query ? 200 : 0);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [open, query, notice]);

  const products = useMemo(() => {
    const grouped = new Map<string, { id: string; name: string; series: CatalogSeries[] }>();
    for (const series of catalog) {
      const product = grouped.get(series.productId) ?? { id: series.productId, name: series.productName, series: [] };
      if (series.id) product.series.push(series);
      grouped.set(series.productId, product);
    }
    return [...grouped.values()];
  }, [catalog]);
  const selectedSeries = catalog.filter((series) => series.id && series.productId === selectedProduct?.id);

  function close() {
    onOpenChange(false);
    setSelectedProduct(null);
    setCreatingProduct(false);
    setQuery("");
    setNewProductName("");
    setNewSeriesName("");
    setSelectedIds([]);
    setError("");
    setNotice("");
    setEditingSeries(null);
    setSeriesToRemove(null);
  }

  function dismissKeyboard() {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }

  async function perform(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    try {
      await action();
      await onAdded();
      setNewSeriesName("");
      setSelectedIds([]);
      setEditingSeries(null);
      setNotice(success);
      setCreatingProduct(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось добавить товар.");
    } finally {
      setBusy(false);
    }
  }

  const content = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden w-full">
      <div className="border-b px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Товары на палете</p>
        <div className="mt-2 flex items-center gap-2">
          {(selectedProduct || creatingProduct) && <Button type="button" size="icon-sm" variant="ghost" aria-label="К поиску товаров" onClick={() => { setSelectedProduct(null); setCreatingProduct(false); setError(""); }}><ArrowLeft className="size-4" /></Button>}
          <h2 className="min-w-0 flex-1 truncate text-xl font-semibold tracking-tight">{creatingProduct ? "Новый товар" : selectedProduct ? selectedProduct.name : "Выберите товар"}</h2>
          <Button type="button" size="sm" variant="ghost" onClick={close}>Готово</Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{creatingProduct ? "Укажите название товара и первую серию." : selectedProduct ? "Добавляйте и редактируйте серии здесь." : "Найдите товар в каталоге или создайте новый."}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-8 sm:p-5">
        {error && <p role="alert" className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-xl bg-primary/10 p-3 text-sm text-foreground">{notice} Можно продолжить работу или закрыть окно.</p>}
        {creatingProduct ? (
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void perform(async () => { const product = await createProduct({ name: newProductName, series: [{ name: newSeriesName, palletIds: [palletId] }] }); setSelectedProduct({ id: product.id, name: product.name }); setQuery(product.name); }, "Товар создан и добавлен."); }}>
            <label className="block space-y-2 text-sm font-medium">Название товара<Input value={newProductName} onChange={(event) => setNewProductName(event.target.value)} placeholder="Например, Парацетамол" required maxLength={200} /></label>
            <label className="block space-y-2 text-sm font-medium">Серия<Input value={newSeriesName} onChange={(event) => setNewSeriesName(event.target.value)} placeholder="Номер или название серии" required maxLength={100} /></label>
            <Button type="submit" disabled={busy || !newProductName.trim() || !newSeriesName.trim()} className="h-11 w-full rounded-xl"><Plus className="size-4" />Создать и добавить</Button>
          </form>
        ) : selectedProduct ? (
          <div className="space-y-5">
            <div className="space-y-2"><p className="text-sm font-medium">Существующие серии</p>{selectedSeries.length ? selectedSeries.map((series) => {
              const assigned = assignedIds.includes(series.id);
              const selected = selectedIds.includes(series.id);
              return <div key={series.id} className={`flex min-h-14 items-center gap-2 rounded-xl border px-3 ${selected ? "border-primary bg-primary/10" : "bg-card"}`}><button type="button" disabled={busy} aria-pressed={selected} onClick={() => { if (!assigned) setSelectedIds((ids) => selected ? ids.filter((id) => id !== series.id) : [...ids, series.id]); }} className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-2 text-left text-sm font-medium"><span className="break-all">{series.name}</span>{assigned ? <span className="shrink-0 text-xs text-muted-foreground">На палете</span> : selected ? <Check className="size-4 shrink-0 text-primary" /> : <Plus className="size-4 shrink-0 text-primary" />}</button><Button type="button" size="icon" variant="ghost" onClick={() => { setEditingSeries(series); setEditedName(series.name); }} className="size-10 shrink-0 rounded-lg" aria-label={`Изменить серию ${series.name}`} title="Изменить серию"><Pencil className="size-4" /></Button>{assigned && <Button type="button" size="icon" variant="ghost" onClick={() => setSeriesToRemove(series)} className="size-10 shrink-0 rounded-lg text-muted-foreground hover:text-destructive" aria-label={`Убрать серию ${series.name} с палеты`} title="Убрать с палеты"><Trash2 className="size-4" /></Button>}</div>;
            }) : <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">У этого товара пока нет серий.</p>}{selectedIds.length > 0 && <Button type="button" disabled={busy} onClick={() => void perform(async () => { for (const id of selectedIds) await addSeriesToPallet(palletId, id); }, "Выбранные серии добавлены.")} className="h-11 w-full rounded-xl">Добавить выбранные серии ({selectedIds.length})</Button>}</div>
            {editingSeries && <form className="space-y-3 rounded-xl border bg-muted/40 p-4" onSubmit={(event) => { event.preventDefault(); void perform(() => renameProductSeries(editingSeries.id, editedName), "Название серии изменено."); }}><label className="block space-y-2 text-sm font-medium">Название серии<Input value={editedName} onChange={(event) => setEditedName(event.target.value)} required maxLength={100} /></label><div className="flex gap-2"><Button type="submit" disabled={busy || !editedName.trim()}>Сохранить</Button><Button type="button" variant="ghost" onClick={() => setEditingSeries(null)}>Отмена</Button></div></form>}
            <form className="space-y-3 border-t pt-5" onSubmit={(event) => { event.preventDefault(); void perform(() => createSeriesOnPallet(selectedProduct.id, palletId, newSeriesName), "Серия создана и добавлена."); }}><label className="block space-y-2 text-sm font-medium">Новая серия<Input value={newSeriesName} onChange={(event) => setNewSeriesName(event.target.value)} placeholder="Введите название серии" required maxLength={100} /></label><Button type="submit" variant="outline" disabled={busy || !newSeriesName.trim()} className="h-11 w-full rounded-xl"><Plus className="size-4" />Создать серию и добавить</Button></form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative"><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по товару или серии" type="search" enterKeyHint="search" onKeyDown={(event) => { if (event.key === "Enter") dismissKeyboard(); }} className="h-12 rounded-xl pl-10 text-base" /></div>
            <button type="button" onClick={() => { setNewProductName(query); setCreatingProduct(true); }} className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-dashed px-4 text-left text-sm font-medium text-foreground hover:bg-accent"><span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Plus className="size-4" /></span>Создать новый товар</button>
            <div className="space-y-2"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Товары в каталоге</p>{products.map((product) => <button key={product.id} type="button" onClick={() => { dismissKeyboard(); setSelectedProduct(product); setSelectedIds([]); setNewSeriesName(""); }} className="flex min-h-14 w-full items-center gap-3 rounded-xl border bg-card px-4 text-left hover:bg-accent"><Package className="size-5 shrink-0 text-primary" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{product.name}</span><span className="text-xs text-muted-foreground">{product.series.length} сер.</span></button>)}{!searching && !products.length && <p className="py-6 text-center text-sm text-muted-foreground">Товары не найдены. Создайте новый.</p>}{searching && <p className="py-4 text-center text-sm text-muted-foreground">Ищем товары…</p>}</div>
          </div>
        )}
      </div>
      <AlertDialog open={seriesToRemove !== null} onOpenChange={(open) => { if (!open) setSeriesToRemove(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Убрать серию с палеты?</AlertDialogTitle><AlertDialogDescription>Серия {seriesToRemove?.name} останется в каталоге товара.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Отмена</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { if (seriesToRemove) void perform(() => removeSeriesFromPallet(palletId, seriesToRemove.id), "Серия убрана с палеты."); setSeriesToRemove(null); }}>Убрать</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );

  if (mobile) return <Drawer open={open} onOpenChange={(value) => { if (!value) close(); else onOpenChange(true); }}><DrawerContent className="h-[92dvh] max-h-[92dvh]"><DrawerHeader className="sr-only"><DrawerTitle>Добавить товар на палету</DrawerTitle></DrawerHeader>{content}</DrawerContent></Drawer>;
  return <Dialog open={open} onOpenChange={(value) => { if (!value) close(); else onOpenChange(true); }}><DialogContent showCloseButton={false} className="flex h-[min(680px,85dvh)] w-4xl flex-col overflow-hidden p-0"><DialogHeader className="sr-only"><DialogTitle>Добавить товар на палету</DialogTitle><DialogDescription>Выберите товар и серию или создайте новый товар.</DialogDescription></DialogHeader>{content}</DialogContent></Dialog>;
}

