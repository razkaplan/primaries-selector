import type { Metadata } from "next";
import { Noto_Sans_Hebrew } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const notoSansHebrew = Noto_Sans_Hebrew({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "בוחרים בפריימריז | כלי עזר לבחירת מועמדים - הדמוקרטים",
  description:
    "כלי לא רשמי שעוזר לחברות וחברי מפלגת הדמוקרטים לבחור מועמדים בפריימריז: שאלון קצר, דירוג מותאם אישית ומידע מרוכז על כל המועמדים.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className={`${notoSansHebrew.className} min-h-full antialiased bg-[#f7f8fc] text-black`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
