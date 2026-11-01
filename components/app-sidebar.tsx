"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Boxes, CircleHelp, LayoutDashboard, LogOut, MapPin, Package } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const user = session?.user;
  const displayName = user?.name?.trim() || user?.email || "Пользователь";

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

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="p-2">
        <Link href="/" className="flex h-10 items-center gap-3 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0" aria-label="Палетбек — главная">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Boxes className="size-4" /></span>
          <span className="truncate text-lg font-semibold tracking-tight group-data-[collapsible=icon]:hidden">Палетбек</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>ФАРМАЦЕВТИЧЕСКИЙ СКЛАД</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem><SidebarMenuButton render={<Link href="/" />} isActive tooltip="Обзор склада"><LayoutDashboard /><span>Обзор склада</span></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton render={<Link href="#products" />} tooltip="Препараты"><Package /><span>Препараты</span></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton render={<Link href="/#pallets" />} tooltip="Палеты"><MapPin /><span>Палеты</span></SidebarMenuButton></SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-3 p-3">
        <Card className="gap-3 rounded-xl p-3 shadow-none group-data-[collapsible=icon]:hidden">
          <span className="flex size-8 items-center justify-center rounded-lg bg-muted"><CircleHelp className="size-4 text-muted-foreground" /></span>
          <div><p className="text-sm font-medium">Нужна помощь?</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Обратитесь к администратору аптеки.</p></div>
        </Card>
        <div className="flex min-w-0 items-center gap-2 rounded-lg p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold" aria-hidden="true">{displayName.slice(0, 1).toLocaleUpperCase()}</span>
          <span className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{displayName}</span>
            {user?.email && user.email !== displayName && <span className="truncate text-xs text-muted-foreground">{user.email}</span>}
          </span>
          <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0 group-data-[collapsible=icon]:mx-auto" onClick={() => void handleSignOut()} disabled={isSigningOut} aria-label="Выйти из аккаунта" title="Выйти из аккаунта">
            <LogOut className="size-4" />
            <span className="sr-only">Выйти из аккаунта</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
