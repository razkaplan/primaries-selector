import type { Metadata } from "next";
import KnessetNav from "@/components/KnessetNav";
import KnessetFooter from "@/components/KnessetFooter";
import QuotesExplorer from "@/components/QuotesExplorer";

export const metadata: Metadata = {
  title: "ציטוטים והתבטאויות | בחירות 2026 לכנסת",
  description:
    "התבטאויות מתועדות של המועמדים: ציטוטים מהרשתות ומהחדשות, עם תאריך וקישור למקור לכל ציטוט, ואפשרות לשתף כל ציטוט כתמונה.",
};

export default function KnessetQuotes() {
  return (
    <main className="min-h-screen">
      <KnessetNav active="/knesset/quotes" />

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-black">ציטוטים והתבטאויות</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-neutral-600">
          התבטאויות פומביות של כל המועמדים הריאליים בכל המפלגות, כפי שפורסמו
          ברשתות ובתקשורת. לכל ציטוט מוצמדים תאריך (כשהמקור מציין אותו) וקישור
          למקור, וכל ציטוט ניתן לשיתוף כתמונה. האיסוף מתעדכן ומתרחב — ראו{" "}
          <a
            href="https://github.com/razkaplan/primaries-selector/blob/main/data/media/SCHEMA.md"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            תיעוד הקורפוס
          </a>
          . ציטוט קטוע (מסומן ב-…) קוראים במלואו בקישור המקור.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12">
        <QuotesExplorer />
      </section>

      <KnessetFooter />
    </main>
  );
}
