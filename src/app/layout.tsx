import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Мотивацию надо поднять",
  description: "Достигай целей в жизни, получай ачивки и расти в уровне",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
