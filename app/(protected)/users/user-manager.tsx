"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type User = { id: string; name: string; email: string; role?: string | null };

export function UserManager() {
  const { data: session } = authClient.useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await authClient.admin.listUsers({ query: { limit: 100 } });
    if (response.error) setError(response.error.message || "Не удалось загрузить пользователей");
    else setUsers(response.data.users);
  }, []);
  useEffect(() => { void load(); }, [load]);

  function edit(user: User | null) {
    if (user?.role === "SUPER_ADMIN" && user.id !== session?.user.id) return;
    setSelected(user); setCreating(!user); setName(user?.name || ""); setEmail(user?.email || "");
    setRole(user?.role || "USER"); setPassword(""); setError("");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (selected) {
        const updated = await authClient.admin.updateUser({ userId: selected.id, data: { name: name.trim(), email: email.trim() } });
        if (updated.error) throw new Error(updated.error.message);
        if (role !== selected.role && selected.id !== session?.user.id) {
          const result = await authClient.admin.setRole({ userId: selected.id, role: role as never });
          if (result.error) throw new Error(result.error.message);
        }
        if (password) {
          const result = await authClient.admin.setUserPassword({ userId: selected.id, newPassword: password });
          if (result.error) throw new Error(result.error.message);
        }
      } else {
        const result = await authClient.admin.createUser({ name: name.trim(), email: email.trim(), password, role: role as never });
        if (result.error) throw new Error(result.error.message);
      }
      setSelected(null); setCreating(false); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось сохранить"); }
    finally { setBusy(false); }
  }

  return <main className="mx-auto max-w-4xl space-y-5 p-4 sm:p-8">
    <div className="flex items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Пользователи</h1><p className="text-sm text-muted-foreground">Управление доступом к складу</p></div><Button onClick={() => edit(null)}>Добавить</Button></div>
    <Input aria-label="Поиск пользователей" placeholder="Поиск по имени или почте" value={query} onChange={(event) => setQuery(event.target.value)} />
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {(creating || selected) && <Card><CardContent className="p-4"><form onSubmit={(event) => void save(event)} className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm">Имя<Input required value={name} onChange={(event) => setName(event.target.value)} /></label><label className="space-y-1 text-sm">Почта<Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="space-y-1 text-sm">{selected ? "Новый пароль (необязательно)" : "Пароль"}<Input type="password" minLength={8} required={!selected} value={password} onChange={(event) => setPassword(event.target.value)} /></label><label className="space-y-1 text-sm">Роль<select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-foreground" value={role} disabled={selected?.id === session?.user.id} onChange={(event) => setRole(event.target.value)}><option value="USER">Пользователь</option><option value="ADMIN">Администратор</option><option value="SUPER_ADMIN">Суперадминистратор</option></select></label><div className="flex gap-2 sm:col-span-2"><Button disabled={busy} type="submit">{busy ? "Сохранение…" : "Сохранить"}</Button><Button type="button" variant="outline" onClick={() => { setSelected(null); setCreating(false); }}>Отмена</Button></div></form></CardContent></Card>}
    <div className="grid gap-3 sm:grid-cols-2">{users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())).map((user) => <Card key={user.id}><CardContent className="flex items-center gap-3 p-4"><div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{user.name[0]?.toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate font-medium">{user.name}</p><p className="truncate text-sm text-muted-foreground">{user.email}</p><p className="text-xs text-muted-foreground">{user.role}</p></div>{(user.role !== "SUPER_ADMIN" || user.id === session?.user.id) && <Button size="sm" variant="outline" onClick={() => edit(user)}>Изменить</Button>}</CardContent></Card>)}</div>
  </main>;
}
