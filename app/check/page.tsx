"use client";

import { useRef, useState } from "react";
import { Barcode, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ScannerCheckPage() {
  const [value, setValue] = useState("");
  const [lastScan, setLastScan] = useState("");
  const [scanCount, setScanCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = value.trim();
    if (!code) return;
    setLastScan(code);
    setScanCount((count) => count + 1);
    setValue("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function reset() {
    setValue("");
    setLastScan("");
    setScanCount(0);
    inputRef.current?.focus();
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-3xl flex-col gap-6 px-4 py-6 md:min-h-screen md:px-8 md:py-10">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-primary"><Barcode className="size-4" aria-hidden="true" /> Проверка оборудования</div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Тест сканера штрихкодов</h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">Проверьте, что сканер работает в режиме Keyboard Wedge и передаёт код как ввод с клавиатуры.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Готов к сканированию</CardTitle>
          <CardDescription>Наведите сканер на любой штрихкод. После считывания он обычно отправляет Enter.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <Label htmlFor="scanner-input">Поле ввода сканера</Label>
            <div className="flex gap-2">
              <Input ref={inputRef} id="scanner-input" autoFocus autoComplete="off" autoCapitalize="off" spellCheck={false} value={value} onChange={(event) => setValue(event.target.value)} placeholder="Нажмите сюда и отсканируйте код" className="h-12 min-w-0 font-mono text-base" />
              <Button type="submit" className="h-12 shrink-0 px-5">Принять</Button>
            </div>
            <p className="text-xs text-muted-foreground">Если сканер не отправляет Enter, нажмите «Принять».</p>
          </form>
        </CardContent>
      </Card>

      <section aria-live="polite" className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Card className="min-w-0">
          <CardHeader className="pb-3"><CardDescription>Последний считанный код</CardDescription></CardHeader>
          <CardContent>
            {lastScan ? <div className="flex items-start gap-2"><Check className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" /><p className="break-all font-mono text-xl font-semibold">{lastScan}</p></div> : <p className="text-sm text-muted-foreground">Пока нет сканирований</p>}
          </CardContent>
        </Card>
        <Card className="sm:min-w-36">
          <CardHeader className="pb-3"><CardDescription>Сканирований</CardDescription></CardHeader>
          <CardContent><p className="text-3xl font-semibold tabular-nums">{scanCount}</p></CardContent>
        </Card>
      </section>

      <div className="mt-auto flex items-center justify-between gap-4 rounded-xl border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">Для проверки подойдет любой товарный штрихкод.</p>
        <Button type="button" variant="outline" onClick={reset} className="shrink-0"><RotateCcw className="size-4" aria-hidden="true" /> Сбросить</Button>
      </div>
    </main>
  );
}
