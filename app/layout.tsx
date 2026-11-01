import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Палетбек — складской учёт",
  description: "Быстрый поиск товаров и палет на складе.",
};

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  return (
      <html lang="ru">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
      </html>
  );
}
