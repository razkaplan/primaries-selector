import type { Metadata } from "next";
import PrimariesTool from "@/components/PrimariesTool";

export const metadata: Metadata = {
  title: "בוחרים בפריימריז | כלי עזר לבחירת מועמדים - הדמוקרטים",
  description:
    "כלי לא רשמי שעוזר לחברות וחברי מפלגת הדמוקרטים לבחור מועמדים בפריימריז: שאלון קצר, דירוג מותאם אישית ומידע מרוכז על כל המועמדים.",
};

export default function PrimariesPage() {
  return <PrimariesTool />;
}
