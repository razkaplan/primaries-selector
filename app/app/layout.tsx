import type { Metadata } from "next";
import { Rubik, Secular_One } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-body",
});

const secularOne = Secular_One({
  subsets: ["hebrew", "latin"],
  weight: "400",
  variable: "--font-display",
});

const SITE = "https://elections.gtmascode.dev";
const OG_TITLE = "בחירות2026: כל הדאטה של הבחירות. בלי אג'נדה.";
const OG_DESCRIPTION =
  "1,200+ סקרים, רשימות המועמדים של כל המפלגות, ציר הזמן של ההתבטאויות ושוקי החיזוי, עם תאריך ומקור לכל נתון. הבחירות לכנסת ה-26 · 27.10.2026.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "בחירות2026 | כל המפלגות, המועמדים והסקרים במקום אחד",
    template: "%s | בחירות2026",
  },
  description:
    "המקור הפתוח לבחירות לכנסת ה-26: רשימות מועמדים של כל המפלגות, כל הסקרים מאז 2022 וציטוטים מתועדים - עם תאריך וקישור למקור לכל נתון.",
  applicationName: "בחירות2026",
  keywords: [
    "בחירות 2026",
    "בחירות לכנסת",
    "סקרים",
    "סקר מנדטים",
    "רשימות מועמדים",
    "הכנסת ה-26",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: SITE,
    siteName: "בחירות2026",
    locale: "he_IL",
    type: "website",
    images: [{ url: "/og-2026.png", width: 1200, height: 630, alt: OG_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: ["/og-2026.png"],
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: "בחירות2026",
      description:
        "כל הדאטה של הבחירות לכנסת ה-26: רשימות מועמדים, סקרים וציטוטים מתועדים.",
      inLanguage: "he",
    },
    {
      "@type": "Dataset",
      name: "סקרי הבחירות לכנסת ה-26",
      description:
        "כל סקרי המנדטים, אחוזי ההצבעה וסקרי התרחישים שפורסמו לקראת הבחירות לכנסת ה-26, מנובמבר 2022 ואילך, עם סוקר, מפרסם, מדגם ותאריך לכל סקר.",
      url: `${SITE}/knesset/polls`,
      license: "https://creativecommons.org/licenses/by-sa/4.0/",
      creator: { "@type": "Person", name: "Raz Kaplan" },
      isBasedOn: "https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_Israeli_legislative_election",
      distribution: {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: "https://github.com/razkaplan/primaries-selector/tree/main/data/elections",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`h-full ${rubik.variable} ${secularOne.variable}`}>
      <body
        className="min-h-full antialiased text-ink"
        style={{ fontFamily: "var(--font-body), sans-serif" }}
      >
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
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
