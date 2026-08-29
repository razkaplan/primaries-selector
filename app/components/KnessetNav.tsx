import Link from "next/link";

const TABS = [
  { href: "/knesset", label: "סקירה" },
  { href: "/knesset/lists", label: "רשימות המועמדים" },
  { href: "/knesset/polls", label: "סקרי מנדטים" },
  { href: "/knesset/polls/more", label: "תרחישים ועוד" },
];

export default function KnessetNav({ active }: { active: string }) {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/knesset" className="text-lg font-black tracking-tight">
          בחירות<span className="text-[#D92731]">2026</span>
          <span className="mr-2 text-xs font-normal text-neutral-400">
            הכנסת ה-26 · 27.10.2026
          </span>
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                active === t.href
                  ? "bg-[#101CAA] text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {t.label}
            </Link>
          ))}
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 font-medium text-neutral-400 hover:bg-neutral-100"
          >
            ← לכלי הפריימריז
          </Link>
        </nav>
      </div>
    </header>
  );
}
