import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corneal Risk App",
  description: "Прототип веб-приложения для прогнозирования риска отторжения трансплантата роговицы"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
