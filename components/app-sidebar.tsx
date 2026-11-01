"use client";

import Link from "next/link";
import { Boxes, CircleHelp, LayoutDashboard, MapPin, Package, Warehouse } from "lucide-react";
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Рабочий аккаунт">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold">С</span>
              <span className="flex min-w-0 flex-col"><span className="truncate font-medium">Сотрудник аптеки</span><span className="truncate text-xs text-muted-foreground">Рабочий аккаунт</span></span>
              <Warehouse className="ml-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
