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
    <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-400">
      <p>
        כלי לא רשמי. הנתונים נאספים מוויקיפדיה האנגלית (
        {SOURCES.map((s, i) => (
          <span key={s.href}>
            {i > 0 && " · "}
            <a href={s.href} className="underline" target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          </span>
        ))}
        ) ברישיון CC BY-SA 4.0. ייתכנו אי-דיוקים או פיגור בעדכון, בדקו במקור.
      </p>
      <p className="mt-1">
        הקוד וצינור הנתונים פתוחים:{" "}
        <a
          href="https://github.com/razkaplan/primaries-selector"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </p>
    </footer>
  );
}
