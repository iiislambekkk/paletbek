"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Boxes, LockKeyhole, MapPin, PackageSearch } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const form = new FormData(event.currentTarget);

    try {
      const { error } = await authClient.signIn.email({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });

      if (error) {
        setError(error.message ?? "Проверьте почту и пароль и попробуйте ещё раз.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Не удалось выполнить вход. Проверьте подключение и попробуйте снова.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-muted/40 px-4 py-8 sm:px-6">
      <ThemeToggle className="absolute right-4 top-4 z-10 rounded-full sm:right-6 sm:top-6" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-40 size-[28rem] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-48 -left-32 size-[30rem] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border bg-background shadow-xl shadow-foreground/5 lg:min-h-[600px] lg:grid-cols-[1fr_0.92fr]">
        <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex xl:p-14">
          <a href="/login" aria-label="Палетбек — вход" className="flex w-fit items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-foreground/15 ring-1 ring-primary-foreground/20">
              <Boxes className="size-6" aria-hidden="true" />
            </span>
            <span className="text-xl font-semibold tracking-tight">Палетбек</span>
          </a>

          <div className="max-w-md">
            <p className="mb-4 text-sm font-medium tracking-wide text-primary-foreground/70">ПОРЯДОК НА СКЛАДЕ</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Нужный товар —
              <br />
              на нужном месте.
            </h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-primary-foreground/75">
              Находите товары и их палеты за секунды. Вся информация о складе — под рукой.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10">
              <MapPin className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium">Каждая палета на карте</p>
              <p className="mt-0.5 text-xs text-primary-foreground/70">Ряд · уровень · секция · номер</p>
            </div>
            <ArrowRight className="ml-auto size-4 text-primary-foreground/60" aria-hidden="true" />
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12">
          <Card className="w-full max-w-md border-0 bg-transparent py-0 shadow-none ring-0">
            <CardHeader className="gap-5 px-0 pb-7">
              <div className="flex items-center gap-3 lg:hidden">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Boxes className="size-5" aria-hidden="true" />
                </span>
                <span className="text-lg font-semibold tracking-tight">Палетбек</span>
              </div>
              <div>
                <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <PackageSearch className="size-6" aria-hidden="true" />
                </div>
                <CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">С возвращением</CardTitle>
                <CardDescription className="mt-2 text-sm leading-6">
                  Войдите в аккаунт, чтобы продолжить работу со складом.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="px-0">
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Электронная почта</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@company.com"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    required
                    disabled={isLoading}
                    className="h-11 rounded-xl px-3"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="password">Пароль</Label>
                    <span className="text-xs text-muted-foreground">Доступ только для сотрудников</span>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Введите пароль"
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                    className="h-11 rounded-xl px-3"
                  />
                </div>

                {error && <Alert variant="destructive" className="rounded-xl"><AlertDescription>{error}</AlertDescription></Alert>}

                <Button type="submit" size="lg" disabled={isLoading} className="h-12 w-full rounded-xl text-base">
                  {isLoading ? "Выполняем вход…" : "Войти в аккаунт"}
                  {!isLoading && <ArrowRight className="ml-1 size-4" aria-hidden="true" />}
                </Button>
              </form>

              <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-muted/70 p-3.5 text-xs leading-5 text-muted-foreground">
                <LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>Вход доступен только сотрудникам склада. Если у вас нет доступа, обратитесь к администратору.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
