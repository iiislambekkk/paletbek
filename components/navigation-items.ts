import { LayoutDashboard, MapPin, Search } from "lucide-react";

export const navigationItems = [
  { href: "/", label: "Обзор", icon: LayoutDashboard, matches: (path: string) => path === "/" },
  { href: "/products", label: "Товары", icon: Search, matches: (path: string) => path.startsWith("/products") },
  { href: "/pallets", label: "Палеты", icon: MapPin, matches: (path: string) => path.startsWith("/pallets") },
];
