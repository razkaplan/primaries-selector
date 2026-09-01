"use client";

import { useState } from "react";

const SITE = "https://elections.gtmascode.dev";

export default function ShareBar({
  path,
  text,
}: {
  path: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = `${SITE}${path}`;
  const enc = encodeURIComponent;
  const targets = [
    {
      label: "וואטסאפ",
      href: `https://wa.me/?text=${enc(`${text}\n${url}`)}`,
      bg: "#25d366",
      icon: (
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5 14.2c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1a13 13 0 0 1-5.9-5.2c-.6-1-.9-2-.9-2.6 0-.7.4-1.4.8-1.7.3-.3.7-.3.9-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.4.8 1.4 1.8 2.2 1.2 1.1 2.2 1.4 2.6 1.6.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.4.1 0 .1.5-.1 1.1Z" />
      ),
    },
    {
      label: "טלגרם",
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`,
      bg: "#2aabee",
      icon: (
        <path d="M21.9 4.6 18.9 19c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-.9.5l.3-4.6L18.2 7c.4-.3-.1-.5-.6-.2L7.4 13.2l-4.4-1.4c-1-.3-1-1 .2-1.4l17.2-6.6c.8-.3 1.5.2 1.5.8Z" />
      ),
    },
    {
      label: "X",
      href: `https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}`,
      bg: "#1c1832",
      icon: (
        <path d="M17.7 3H21l-7.3 8.3L22.2 21h-6.7l-5.3-6.4L4.2 21H1l7.8-8.9L1.5 3h6.9l4.8 5.9L17.7 3Zm-1.2 16h1.9L6.8 4.9H4.8L16.5 19Z" />
      ),
    },
    {
      label: "פייסבוק",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      bg: "#1877f2",
      icon: (
        <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z" />
      ),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold text-ink-faint">שיתוף:</span>
      {targets.map((t) => (
        <a
          key={t.label}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          title={`שיתוף ב${t.label}`}
          aria-label={`שיתוף ב${t.label}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: t.bg }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            {t.icon}
          </svg>
        </a>
      ))}
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          } catch {
            /* clipboard unavailable */
          }
        }}
        className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink-soft hover:border-brand hover:text-brand"
      >
        {copied ? "הועתק! ✓" : "העתקת קישור"}
      </button>
    </div>
  );
}
