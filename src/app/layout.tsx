import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BIM EOW — Báo cáo hằng ngày",
  description: "BIM Wind Farm — EOW Inspection Daily Work Report",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      {/* Bộ chữ đặt ở globals.css, không đặt inline: style inline thắng mọi
          quy tắc CSS nên trước đây nó vô hiệu hoá luôn phần khai báo kia. */}
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
