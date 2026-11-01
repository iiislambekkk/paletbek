"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { rememberViewed } from "@/lib/recently-viewed";
import { ArrowLeft, Check, Pencil, Package, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { loadPallet, removeSeriesFromPallet } from "../../actions";
import { AddProductPanel } from "./add-product-panel";

type SeriesEntry = { id: string; name: string; product: { id: string; name: string } };
type PalletData = { id: string; name: string; series: SeriesEntry[] };

export function PalletDetails({ palletId }: { palletId: string }) {
  const [pallet, setPallet] = useState<PalletData | null>(null);
  useEffect(() => {
    if (pallet) rememberViewed("pallets", { id: pallet.id, name: pallet.name });
  }, [pallet]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{ id: string; name: string } | null>(null);
  const [seriesToRemove, setSeriesToRemove] = useState<SeriesEntry | null>(null);
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

  const addressParts = pallet?.name.match(/^P-(\d+)-(\d+)-(\d+)\/\d+$/);
  const backHref = addressParts
    ? `/pallets#${addressParts[1]}-${addressParts[2]}-${addressParts[3]}`
    : "/pallets";

  async function remove(seriesId: string) {
    try { await removeSeriesFromPallet(palletId, seriesId); await refresh(); setSeriesToRemove(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось убрать товар."); }
  }

  return <>
    <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-7 sm:px-6 sm:pt-9 lg:px-10"><Button variant="ghost" render={<Link href={backHref} />} className="mb-5 -ml-3 rounded-lg text-muted-foreground"><ArrowLeft className="size-4" />К палетам</Button><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-muted-foreground">Содержимое палеты</p><h1 className="mt-1 break-all text-2xl font-semibold tracking-tight sm:text-3xl">{loading ? "Загрузка…" : pallet?.name ?? "Палета"}</h1><p className="mt-2 text-sm text-muted-foreground">Выбирайте, добавляйте и изменяйте серии товаров.</p></div>{pallet && <Button onClick={() => { setEditingProduct(null); setPickerOpen(true); }} className="h-11 rounded-xl"><Plus className="size-4" />Добавить товар</Button>}</div>
      {error && <p role="alert" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
      <section className="mt-8"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Серии на палете</h2><p className="mt-1 text-sm text-muted-foreground">{pallet?.series.length ?? 0} серий</p></div><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Package className="size-5" /></span></div><div className="space-y-3">{pallet?.series.length ? pallet.series.map((series) => <Card key={series.id} className="flex-row items-center gap-3 rounded-2xl p-4 shadow-none"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Package className="size-5" /></span><div className="min-w-0 flex-1"><h3 className="font-medium">{series.product.name}</h3><p className="mt-1 text-sm text-muted-foreground">Серия: {series.name}</p></div><Button variant="outline" size="icon" onClick={() => { setEditingProduct(series.product); setPickerOpen(true); }} className="size-10 shrink-0 rounded-lg" aria-label={`Изменить серии товара ${series.product.name}`} title="Изменить серии"><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" onClick={() => setSeriesToRemove(series)} aria-label={`Убрать серию ${series.name} товара ${series.product.name} с палеты`} className="size-10 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></Button></Card>) : <Card className="flex flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center shadow-none"><span className="flex size-12 items-center justify-center rounded-2xl bg-muted"><Search className="size-5 text-muted-foreground" /></span><div><h3 className="font-medium">{loading ? "Загружаем серии…" : "На палете пока нет серий"}</h3><p className="mt-1 text-sm text-muted-foreground">Добавьте серию через поиск.</p></div><Button variant="outline" onClick={() => setPickerOpen(true)} disabled={!pallet} className="rounded-lg"><Plus className="size-4" />Добавить серию</Button></Card>}</div></section>{pallet && <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><Check className="size-3.5" />Удаление с палеты не удаляет сам товар или его другие палеты.</p>}
      {pallet && <AddProductPanel palletId={palletId} assignedIds={pallet.series.map((series) => series.id)} open={pickerOpen} onOpenChange={(value) => { setPickerOpen(value); if (!value) setEditingProduct(null); }} onAdded={refresh} initialProduct={editingProduct} />}
      <AlertDialog open={seriesToRemove !== null} onOpenChange={(open) => { if (!open) setSeriesToRemove(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Убрать серию с палеты?</AlertDialogTitle><AlertDialogDescription>{seriesToRemove?.product.name} · серия {seriesToRemove?.name}. Сама серия и товар останутся в каталоге.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Отмена</AlertDialogCancel><AlertDialogAction onClick={() => { if (seriesToRemove) void remove(seriesToRemove.id); }} variant="destructive">Убрать</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </main></>;
}
