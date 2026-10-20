import Link from "next/link";
import { meta } from "@/lib/elections";
import { BrandMark } from "@/components/KnessetNav";

const SOURCES = [
  {
    href: "https://en.wikipedia.org/wiki/Party_lists_for_the_2026_Israeli_legislative_election",
    label: "רשימות המועמדים",
  },
  {
    href: "https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_Israeli_legislative_election",
    label: "סקרי הבחירות",
  },
];

export default function KnessetFooter() {
  return (
    <footer className="mt-8 bg-night text-white/80">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="font-display text-xl text-white">
              בחירות<span className="text-sun">26</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed">
            כל הדאטה של הבחירות לכנסת ה-26 במקום אחד: רשימות, סקרים
            וציטוטים, עם תאריך ומקור לכל נתון. פרויקט עצמאי בקוד פתוח,
            לא קשור לאף מפלגה.
          </p>
        </div>
        <div className="text-sm">
          <h3 className="font-display text-base text-white">שקיפות מלאה</h3>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/about" className="underline decoration-white/30 underline-offset-4 hover:text-sun">
                המתודולוגיה והמקורות
              </Link>
            </li>
            {SOURCES.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="underline decoration-white/30 underline-offset-4 hover:text-sun">
                  מקור: {s.label} (ויקיפדיה, CC BY-SA)
                </a>
              </li>
            ))}
            <li>
              <a
                href="https://github.com/razkaplan/primaries-selector"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-white/30 underline-offset-4 hover:text-sun"
              >
                הקוד והדאטה פתוחים ב-GitHub
              </a>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <h3 className="font-display text-base text-white">חשוב לדעת</h3>
          <p className="mt-3 leading-relaxed">
            הנתונים נאספים ממקורות פומביים ועשויים לכלול אי-דיוקים או פיגור
            בעדכון, בדקו במקור המקושר. מצאתם טעות?{" "}
            <a
              href="https://github.com/razkaplan/primaries-selector/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-white/30 underline-offset-4 hover:text-sun"
            >
              פתחו Issue
            </a>{" "}
            ותקבלו עדיפות.
          </p>
          <p className="mt-3 text-xs text-white/50">
            עודכן לאחרונה: {meta.scraped_at} · נבנה באהבה לדמוקרטיה ·{" "}
            <span dir="ltr">
              by{" "}
              <a
                href="https://il.linkedin.com/in/razkaplan"
                className="underline decoration-white/30 hover:text-sun"
                target="_blank"
                rel="noopener noreferrer"
              >
                Raz Kaplan
              </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
