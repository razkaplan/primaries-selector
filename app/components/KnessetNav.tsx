import Link from "next/link";

const TABS = [
  { href: "/", label: "סקירה" },
  { href: "/knesset/lists", label: "רשימות" },
  { href: "/knesset/polls", label: "סקרים" },
  { href: "/knesset/polls/more", label: "תרחישים" },
  { href: "/knesset/quotes", label: "ציטוטים" },
  { href: "/about", label: "מתודולוגיה" },
];

/** The ballot-spark: a ballot slip dropping into a box, mid-celebration. */
export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="6" y="22" width="36" height="20" rx="5" fill="#5a31f4" />
      <rect x="14" y="19" width="20" height="5" rx="2.5" fill="#3d1ebe" />
      <rect x="17" y="6" width="14" height="18" rx="2.5" fill="#ffffff" stroke="#1c1832" strokeWidth="2.4" transform="rotate(8 24 15)" />
      <path d="M20.5 14.5l2.6 2.8 5-5.6" fill="none" stroke="#ff4d6d" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" transform="rotate(8 24 15)" />
      <circle cx="8.5" cy="10" r="2.4" fill="#ffc53d" />
      <circle cx="41" cy="14" r="1.8" fill="#12b5a5" />
      <circle cx="37" cy="5.5" r="1.5" fill="#ff4d6d" />
      <rect x="12" y="29" width="24" height="6" rx="3" fill="#ffffff" opacity="0.25" />
    </svg>
  );
}

export default function KnessetNav({ active }: { active: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark />
          <span className="font-display text-2xl leading-none">
            בחירות<span className="text-brand">26</span>
            <span className="mt-0.5 block text-[10px] font-body font-medium tracking-wide text-ink-faint">
              כל הדאטה. בלי אג'נדה. · 27.10.2026
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded-full px-3.5 py-1.5 font-bold transition-all ${
                active === t.href
                  ? "bg-ink text-sun shadow-sm"
                  : "text-ink-soft hover:bg-brand-wash hover:text-brand-deep"
              }`}
            >
              {t.label}
            </Link>
          ))}
          <Link
            href="/primaries"
            className="mr-1 rounded-full border-2 border-dashed border-ink-faint/50 px-3.5 py-1 font-bold text-ink-faint transition-colors hover:border-brand hover:text-brand"
          >
            כלי הפריימריז
          </Link>
        </nav>
      </div>
    </header>
  );
}
