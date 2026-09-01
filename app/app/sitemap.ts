import type { MetadataRoute } from "next";
import { meta } from "@/lib/elections";

const SITE = "https://elections.gtmascode.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(meta.scraped_at + "T00:00:00Z");
  const page = (
    path: string,
    priority: number,
    changeFrequency: "daily" | "weekly" = "daily",
  ) => ({ url: `${SITE}${path}`, lastModified, changeFrequency, priority });
  return [
    page("/", 1),
    page("/knesset/polls", 0.9),
    page("/knesset/lists", 0.9),
    page("/knesset/quotes", 0.8),
    page("/knesset/markets", 0.8),
    page("/knesset/polls/more", 0.7),
    page("/about", 0.5, "weekly"),
    page("/primaries", 0.3, "weekly"),
  ];
}
