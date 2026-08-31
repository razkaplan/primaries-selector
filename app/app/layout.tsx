import type { Metadata } from "next";
import { Noto_Sans_Hebrew } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

const notoSansHebrew = Noto_Sans_Hebrew({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "700", "900"],
});

const OG_TITLE = "בחירות 2026 לכנסת - כל המפלגות, המועמדים והסקרים";
const OG_DESCRIPTION =
  "רשימות המועמדים של כל המפלגות, כל סקרי הבחירות מאז 2022 וציטוטים מתועדים של המועמדים - עם תאריך ומקור לכל נתון. הבחירות ב-27.10.2026.";

export const metadata: Metadata = {
  metadataBase: new URL("https://elections.gtmascode.dev"),
  title: "בחירות 2026 לכנסת | כל המפלגות, המועמדים והסקרים",
  description:
    "כלי לא רשמי לבחירות לכנסת ה-26: רשימות המועמדים של כל המפלגות, כל הסקרים שפורסמו מאז 2022, וציטוטים מתועדים עם תאריך ומקור.",
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: "https://elections.gtmascode.dev",
    siteName: "בוחרים בפריימריז",
    locale: "he_IL",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: OG_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: ["/og.png"],
  },
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-V7LGK8CMHQ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-V7LGK8CMHQ');
          `}
        </Script>
      </body>
    </html>
  );
}
