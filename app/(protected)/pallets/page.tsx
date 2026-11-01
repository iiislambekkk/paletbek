"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Boxes, MapPin, Warehouse } from "lucide-react";
import { loadWarehouseData } from "../actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Pallet = { id: string; name: string; productCount: number };
const addressPattern = /^P-(\d+)-(\d+)-(\d+)\/(\d+)$/;

export default function PalletsPage() {
  const pathname = usePathname();
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [row, setRow] = useState("");
  const [level, setLevel] = useState("");
  const [section, setSection] = useState("");

  useEffect(() => {
    if (pathname !== "/pallets") {
      setRow("");
      setLevel("");
      setSection("");
    }
  }, [pathname]);

  useEffect(() => {
    const address = /^#(\d+)-(\d+)-(\d+)$/.exec(window.location.hash);
    if (address) {
      setRow(address[1]);
      setLevel(address[2]);
      setSection(address[3]);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    loadWarehouseData().then(({ pallets }) => setPallets(pallets)).catch(() => setError("Не удалось загрузить палеты. Обновите страницу.")).finally(() => setLoading(false));
  }, []);

  const parsed = pallets.map((pallet) => ({ pallet, parts: addressPattern.exec(pallet.name) }));
  const options = (values: string[]) => [...new Set(values)].sort((a, b) => Number(a) - Number(b));
  const rows = options(parsed.flatMap(({ parts }) => parts ? [parts[1]] : []));
  const currentRow = rows.includes(row) ? row : "";
  const levels = options(parsed.flatMap(({ parts }) => parts?.[1] === currentRow ? [parts[2]] : []));
  const currentLevel = levels.includes(level) ? level : "";
  const sections = options(parsed.flatMap(({ parts }) => parts?.[1] === currentRow && parts[2] === currentLevel ? [parts[3]] : []));
  const currentSection = sections.includes(section) ? section : "";
  const back = () => currentSection ? setSection("") : currentLevel ? setLevel("") : setRow("");
  const count = (r: string, l?: string, s?: string) => parsed.filter(({ parts }) => parts && parts[1] === r && (!l || parts[2] === l) && (!s || parts[3] === s)).length;
  const step = !currentRow ? "Выберите ряд" : !currentLevel ? "Выберите уровень" : !currentSection ? "Выберите секцию" : "Выберите палету";
  const tiles = !currentRow ? rows.map((value) => ({ value, label: `Ряд ${value}`, count: count(value), icon: Warehouse, action: () => setRow(value) })) : !currentLevel ? levels.map((value) => ({ value, label: `Уровень ${value}`, count: count(currentRow, value), icon: Boxes, action: () => setLevel(value) })) : sections.map((value) => ({ value, label: `Секция ${value}`, count: count(currentRow, currentLevel, value), icon: MapPin, action: () => setSection(value) }));

  return <>
    <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-6 sm:px-6 lg:px-10">
      <div className="flex items-center gap-3">{currentRow && <Button type="button" variant="outline" size="icon" className="size-11 shrink-0 rounded-xl" aria-label="Назад" onClick={back}><ArrowLeft className="size-5" /></Button>}<div><h1 className="text-2xl font-semibold tracking-tight">Палеты</h1><p className="mt-1 text-sm text-muted-foreground">{step}</p></div></div>
      <nav aria-label="Путь к паллете" className="mt-5 overflow-x-auto rounded-2xl border bg-card p-2 shadow-sm">
        <ol className="flex min-w-max items-center gap-1 text-sm font-medium">
          <li><button type="button" onClick={() => { setRow(""); setLevel(""); setSection(""); }} aria-current={!currentRow ? "step" : undefined} className={`min-h-10 rounded-xl px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${!currentRow ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"}`}>Склад</button></li>
          {currentRow && <><li aria-hidden="true" className="px-1 text-muted-foreground">›</li><li><button type="button" onClick={() => { setLevel(""); setSection(""); }} aria-current={!currentLevel ? "step" : undefined} className={`min-h-10 rounded-xl px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${!currentLevel ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"}`}>Ряд {currentRow}</button></li></>}
          {currentLevel && <><li aria-hidden="true" className="px-1 text-muted-foreground">›</li><li><button type="button" onClick={() => setSection("")} aria-current={!currentSection ? "step" : undefined} className={`min-h-10 rounded-xl px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${!currentSection ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"}`}>Уровень {currentLevel}</button></li></>}
          {currentSection && <><li aria-hidden="true" className="px-1 text-muted-foreground">›</li><li><span aria-current="step" className="flex min-h-10 items-center rounded-xl bg-primary px-3 text-primary-foreground">Секция {currentSection}</span></li></>}
        </ol>
      </nav>
      {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
      {loading ? <Card className="mt-5 rounded-2xl p-6 text-center text-muted-foreground">Загружаем палеты…</Card> : !rows.length ? <Card className="mt-5 rounded-2xl p-6 text-center text-muted-foreground">Палеты пока не добавлены</Card> : <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{!currentSection ? tiles.map(({ value, label, count, icon: Icon, action }) => <button key={value} type="button" onClick={action} className="flex min-h-32 flex-col items-start justify-between rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon className="size-6 text-primary" /><span className="text-lg font-semibold">{label}</span><span className="text-xs text-muted-foreground">{count} палет</span></button>) : parsed.filter(({ parts }) => parts?.[1] === currentRow && parts[2] === currentLevel && parts[3] === currentSection).sort((a, b) => Number(a.parts![4]) - Number(b.parts![4])).map(({ pallet, parts }) => <Link key={pallet.id} href={`/pallets/${pallet.id}`} className="flex min-h-32 flex-col items-start justify-between rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Boxes className="size-6 text-primary" /><span className="text-lg font-semibold">Палета {parts![4]}</span><span className="text-xs text-muted-foreground">{pallet.name} · {pallet.productCount} товаров</span></Link>)}</div>}
    </main>
  </>;
}
