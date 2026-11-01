"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { rememberViewed } from "@/lib/recently-viewed";
import { ArrowLeft, Boxes, Check, MapPin, Package, Pencil, Plus, Trash2, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { addSeriesToPallet, createSeriesOnPallet, loadPalletOptions, loadProduct, removeSeriesFromPallet, renameProductSeries } from "../../actions";

type Product = NonNullable<Awaited<ReturnType<typeof loadProduct>>>;
type Pallet = Awaited<ReturnType<typeof loadPalletOptions>>[number];
type Series = Product["series"][number];
const addressPattern = /^P-(\d+)-(\d+)-(\d+)\/(\d+)$/;

export function ProductDetails({ initialProduct }: { initialProduct: Product }) {
  const [product, setProduct] = useState(initialProduct);
  useEffect(() => {
    rememberViewed("products", { id: product.id, name: product.name });
  }, [product.id, product.name]);
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [mobile, setMobile] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [creatingSeries, setCreatingSeries] = useState(false);
  const [row, setRow] = useState("");
  const [level, setLevel] = useState("");
  const [section, setSection] = useState("");
  const [seriesToRemove, setSeriesToRemove] = useState<{ series: Series; pallet: Pallet } | null>(null);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [editedName, setEditedName] = useState("");
  const [newSeriesName, setNewSeriesName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    void loadPalletOptions().then(setPallets).catch(() => setError("Не удалось загрузить палеты."));
    return () => media.removeEventListener("change", update);
  }, []);

  async function refresh() {
    const updated = await loadProduct(product.id);
    if (updated) setProduct(updated);
  }

  async function perform(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
      setNotice(success);
      setNewSeriesName("");
      setEditingSeries(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить изменение.");
    } finally {
      setBusy(false);
    }
  }

  function openPicker(series: Series) {
    setCreatingSeries(false);
    setSelectedSeries(series);
    setRow("");
    setLevel("");
    setSection("");
    setNotice("");
  }

  const parsed = pallets.map((pallet) => ({ pallet, parts: addressPattern.exec(pallet.name) }));
  const options = (values: string[]) => [...new Set(values)].sort((a, b) => Number(a) - Number(b));
  const rows = options(parsed.flatMap(({ parts }) => parts ? [parts[1]] : []));
  const levels = options(parsed.flatMap(({ parts }) => parts?.[1] === row ? [parts[2]] : []));
  const sections = options(parsed.flatMap(({ parts }) => parts?.[1] === row && parts[2] === level ? [parts[3]] : []));
  const choices = parsed.filter(({ parts }) => parts?.[1] === row && parts[2] === level && parts[3] === section);
  const currentSeries = product.series.find((series) => series.id === selectedSeries?.id);
  const count = (r: string, l?: string, s?: string) => parsed.filter(({ parts }) => parts && parts[1] === r && (!l || parts[2] === l) && (!s || parts[3] === s)).length;

  const pickerContent = <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
    <div className="border-b px-5 py-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Добавление на палету</p><h2 className="mt-1 truncate text-xl font-semibold">{creatingSeries ? "Новая серия" : `Серия ${selectedSeries?.name}`}</h2><p className="mt-1 text-sm text-muted-foreground">Выберите адрес палеты. Можно добавить серию на несколько палет подряд.</p></div><Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedSeries(null); setCreatingSeries(false); }}>Готово</Button></div>{creatingSeries && <label className="mt-4 block space-y-2 text-sm font-medium">Название новой серии<Input value={newSeriesName} onChange={(event) => setNewSeriesName(event.target.value)} placeholder="Введите серию" maxLength={100} required /></label>}</div>
    <nav aria-label="Путь к палете" className="mx-5 mt-4 overflow-x-auto rounded-xl border bg-card p-1.5"><ol className="flex min-w-max items-center gap-1 text-sm font-medium">{[
      { label: "Склад", active: !row, action: () => { setRow(""); setLevel(""); setSection(""); } },
      ...(row ? [{ label: `Ряд ${row}`, active: !level, action: () => { setLevel(""); setSection(""); } }] : []),
      ...(level ? [{ label: `Уровень ${level}`, active: !section, action: () => setSection("") }] : []),
      ...(section ? [{ label: `Секция ${section}`, active: true, action: () => {} }] : []),
    ].map((step, index) => <li key={step.label} className="flex items-center gap-1">{index > 0 && <span aria-hidden="true" className="px-1 text-muted-foreground">›</span>}<button type="button" aria-current={step.active ? "step" : undefined} onClick={step.action} className={`min-h-10 rounded-lg px-3 ${step.active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"}`}>{step.label}</button></li>)}</ol></nav>
    <div className="min-h-0 flex-1 overflow-y-auto p-5">{notice && <p role="status" className="mb-4 rounded-xl bg-primary/10 p-3 text-sm">{notice}</p>}{error && <p role="alert" className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <p className="mb-3 text-sm font-medium">{!row ? "Выберите ряд" : !level ? "Выберите уровень" : !section ? "Выберите секцию" : "Выберите палету"}</p>
      <div className="grid grid-cols-2 gap-3">{!row ? rows.map((value) => <button key={value} type="button" onClick={() => setRow(value)} className="flex min-h-28 flex-col justify-between rounded-2xl border bg-card p-4 text-left hover:bg-accent"><Warehouse className="size-5 text-primary" /><span className="font-semibold">Ряд {value}</span><span className="text-xs text-muted-foreground">{count(value)} палет</span></button>) : !level ? levels.map((value) => <button key={value} type="button" onClick={() => setLevel(value)} className="flex min-h-28 flex-col justify-between rounded-2xl border bg-card p-4 text-left hover:bg-accent"><Boxes className="size-5 text-primary" /><span className="font-semibold">Уровень {value}</span><span className="text-xs text-muted-foreground">{count(row, value)} палет</span></button>) : !section ? sections.map((value) => <button key={value} type="button" onClick={() => setSection(value)} className="flex min-h-28 flex-col justify-between rounded-2xl border bg-card p-4 text-left hover:bg-accent"><MapPin className="size-5 text-primary" /><span className="font-semibold">Секция {value}</span><span className="text-xs text-muted-foreground">{count(row, level, value)} палет</span></button>) : choices.map(({ pallet, parts }) => {
        const assigned = currentSeries?.locations.includes(pallet.name);
        return <button key={pallet.id} type="button" disabled={busy || assigned || (creatingSeries && !newSeriesName.trim())} onClick={() => { if (creatingSeries) { void perform(async () => { const created = await createSeriesOnPallet(product.id, pallet.id, newSeriesName); setSelectedSeries({ id: created.id, name: newSeriesName.trim(), locations: [pallet.name] }); setCreatingSeries(false); }, `Серия создана на палете ${pallet.name}.`); } else if (selectedSeries) { void perform(() => addSeriesToPallet(pallet.id, selectedSeries.id), `Добавлено на палету ${pallet.name}.`); } }} className="flex min-h-28 flex-col justify-between rounded-2xl border bg-card p-4 text-left hover:bg-accent disabled:opacity-60"><Boxes className="size-5 text-primary" /><span className="font-semibold">Палета {parts?.[4]}</span><span className="text-xs text-muted-foreground">{assigned ? "Уже на палете" : pallet.name}</span></button>;
      })}</div>{!rows.length && <p className="py-8 text-center text-sm text-muted-foreground">Палеты пока не добавлены.</p>}</div>
  </div>;

  return <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 sm:px-6 lg:px-10">
    <Button variant="ghost" render={<Link href="/products" />} className="mb-5 -ml-3"><ArrowLeft className="size-4" />Все товары</Button>
    <div className="flex items-start gap-3"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Package className="size-6" /></span><div className="min-w-0"><h1 className="break-words text-2xl font-semibold tracking-tight">{product.name}</h1><p className="mt-1 text-sm text-muted-foreground">Серии и их расположение на палетах</p></div></div>
    {error && !selectedSeries && <p role="alert" className="mt-5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {notice && !selectedSeries && <p role="status" className="mt-5 rounded-xl bg-primary/10 p-3 text-sm">{notice}</p>}
    <div className="mt-8 flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Серии товара</h2><p className="text-sm text-muted-foreground">{product.series.length} серий</p></div><Button variant="outline" onClick={() => { setSelectedSeries(null); setCreatingSeries(true); setRow(""); setLevel(""); setSection(""); setNotice(""); }}><Plus className="size-4" />Новая серия</Button></div>
    <div className="mt-4 space-y-4">{product.series.map((series) => <Card key={series.id} className="gap-4 rounded-2xl p-4 shadow-none"><div className="flex items-center gap-2"><Badge variant="secondary" className="min-w-0 max-w-full truncate">Серия {series.name}</Badge><div className="ml-auto flex shrink-0 gap-1"><Button type="button" variant="ghost" size="icon" aria-label={`Изменить серию ${series.name}`} title="Изменить серию" onClick={() => { setEditingSeries(series); setEditedName(series.name); }}><Pencil className="size-4" /></Button></div></div>
      {editingSeries?.id === series.id && <form className="flex flex-wrap gap-2 rounded-xl bg-muted/50 p-3" onSubmit={(event) => { event.preventDefault(); void perform(() => renameProductSeries(series.id, editedName), "Название серии изменено."); }}><Input value={editedName} onChange={(event) => setEditedName(event.target.value)} aria-label="Название серии" className="min-w-36 flex-1" required /><Button type="submit" disabled={busy}>Сохранить</Button><Button type="button" variant="ghost" onClick={() => setEditingSeries(null)}>Отмена</Button></form>}
      <div className="flex flex-wrap gap-2">{series.locations.map((name) => { const pallet = product.pallets.find((entry) => entry.name === name); return <div key={name} className="flex min-h-11 items-center rounded-xl border bg-card pl-3"><Link href={pallet ? `/pallets/${pallet.id}` : "/pallets"} className="flex items-center gap-2 font-mono text-sm font-medium hover:text-primary"><MapPin className="size-4 text-primary" />{name}</Link>{pallet && <Button type="button" variant="ghost" size="icon-sm" aria-label={`Убрать серию ${series.name} с палеты ${name}`} title="Убрать с палеты" onClick={() => setSeriesToRemove({ series, pallet })} className="ml-1 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></Button>}</div>; })}{!series.locations.length && <p className="text-sm text-muted-foreground">Пока нет ни на одной палете</p>}</div>
      <Button type="button" variant="outline" onClick={() => openPicker(series)} className="h-11 w-full rounded-xl sm:w-fit"><Plus className="size-4" />Добавить на палету</Button></Card>)}</div>
    <AlertDialog open={seriesToRemove !== null} onOpenChange={(open) => { if (!open) setSeriesToRemove(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Убрать серию с палеты?</AlertDialogTitle><AlertDialogDescription>Серия {seriesToRemove?.series.name} товара {product.name} будет убрана с палеты {seriesToRemove?.pallet.name}. В каталоге серия останется.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Отмена</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { if (seriesToRemove) void perform(() => removeSeriesFromPallet(seriesToRemove.pallet.id, seriesToRemove.series.id), "Серия убрана с палеты."); setSeriesToRemove(null); }}>Убрать</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    {mobile ? <Drawer open={selectedSeries !== null || creatingSeries} onOpenChange={(open) => { if (!open) { setSelectedSeries(null); setCreatingSeries(false); } }}><DrawerContent className="max-h-[90dvh]"><DrawerHeader className="sr-only"><DrawerTitle>Выбор палеты</DrawerTitle></DrawerHeader>{pickerContent}</DrawerContent></Drawer> : <Dialog open={selectedSeries !== null || creatingSeries} onOpenChange={(open) => { if (!open) { setSelectedSeries(null); setCreatingSeries(false); } }}><DialogContent showCloseButton={false} className="flex h-[min(680px,85dvh)] max-w-xl flex-col overflow-hidden p-0"><DialogHeader className="sr-only"><DialogTitle>Выбор палеты</DialogTitle><DialogDescription>Выберите ряд, уровень, секцию и палету.</DialogDescription></DialogHeader>{pickerContent}</DialogContent></Dialog>}
  </main>;
}
