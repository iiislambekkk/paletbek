"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const user = session?.user;
  const displayName = user?.name?.trim() || user?.email || "Пользователь";
  const title = pathname.startsWith("/pallets/") ? "Палета" : pathname === "/pallets" ? "Палеты" : pathname === "/check" ? "Сканер" : pathname === "/users" ? "Пользователи" : "Обзор склада";

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar/95 px-4 text-sidebar-foreground backdrop-blur sm:px-6 lg:h-[72px] lg:px-10">
    <div className="flex min-w-0 items-center gap-3"><SidebarTrigger className="size-9 shrink-0" /><span className="truncate text-sm font-semibold">{title}</span></div>
    <div className="flex shrink-0 items-center gap-4">
      <ThemeToggle className="size-9 rounded-full" />
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Профиль" className="flex size-11 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-muted-foreground outline-offset-2 focus-visible:outline-2">
          {user?.id ? <Image unoptimized src={`https://api.dicebear.com/10.x/thumbs/svg?backgroundColor=ff5d8f,ffb703,43aa8b,4d96ff,b57bff&shapeColor=ffffff&seed=${encodeURIComponent(user.id)+19}`} alt="" width={36} height={36} className="size-full" /> : displayName.slice(0, 1).toLocaleUpperCase()}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
            {user?.email && user.email !== displayName && <div className="truncate px-1.5 pb-2 text-xs text-muted-foreground">{user.email}</div>}
          </DropdownMenuGroup>
          {user?.role === "SUPER_ADMIN" && <DropdownMenuItem render={<Link href="/users" />}><Users className="size-4" /> Пользователи</DropdownMenuItem>}
          <DropdownMenuItem disabled={isSigningOut} onClick={() => void handleSignOut()}><LogOut className="size-4" /> Выйти</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>;
}
