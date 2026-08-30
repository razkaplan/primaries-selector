/** Hebrew display labels for the English strings the Wikipedia scraper
 * yields: polling firms, publishers, scenario titles and campaign events.
 * Fallback everywhere is the original string, so an unmapped new value
 * degrades to English instead of disappearing. */

const FIRMS_HE: Record<string, string> = {
  "2022 election result (estimation)": "תוצאות בחירות 2022 (אומדן)",
  "2022 legislative election": "תוצאות בחירות 2022",
  Arpanel: "ארפנל",
  "Camil Fuchs": "קמיל פוקס",
  "Direct Polls": "דיירקט פולס",
  Filber: "פילבר",
  Kantar: "קנטאר",
  Lazar: "מכון לזר",
  "Maagar Mochot": "מאגר מוחות",
  "Midgam Project": "פרויקט המדגם",
  "Midgam Project & Stat Net": "פרויקט המדגם וסטאט-נט",
  "Midgam R&C": "מדגם",
  "Panels Politics": "פאנלס פוליטיקס",
  "Smith Consulting": "מכון סמית",
  "Stat-Net Research Institute": "מכון סטאט-נט",
  "Timor Group": "קבוצת טימור",
  TrendZone: "טרנדזון",
  "Viterbi Center": "מרכז ויטרבי",
  "Yossi Tatika": "יוסי טטיקה",
  "theMadad.com Afkar Research": "המדד / אפקאר",
};

const PUBLISHERS_HE: Record<string, string> = {
  "2022 election result (estimation)": "תוצאות בחירות 2022 (אומדן)",
  "2022 legislative election": "תוצאות בחירות 2022",
  "Amit Segal": "עמית סגל",
  "Arutz Sheva": "ערוץ 7",
  "Attila Somfalvi": "אטילה שומפלבי",
  "Channel 12": "ערוץ 12",
  "Channel 13": "ערוץ 13",
  "Channel 14": "ערוץ 14",
  "Channel 16": "ערוץ 16",
  "HaHadashot 12": "חדשות 12",
  IDI: "המכון הישראלי לדמוקרטיה",
  "Israel Democracy Institute": "המכון הישראלי לדמוקרטיה",
  "Israel Hayom": "ישראל היום",
  JPPI: "המכון למדיניות העם היהודי",
  "KAP, Tel Aviv University": "אוניברסיטת תל אביב (KAP)",
  "Kan 11": "כאן 11",
  "MDC/KAS": "MDC/KAS",
  Maariv: "מעריב",
  "Maariv [better source needed]": "מעריב",
  "The Abraham Initiatives": "יוזמות אברהם",
  "The Jerusalem Post": "ג'רוזלם פוסט",
  "The Times of Israel": "טיימס אוף ישראל",
  "The Truth Machine": "מכונת האמת",
  Walla: "וואלה",
  "Zman Israel": "זמן ישראל",
  "Zman Yisrael": "זמן ישראל",
  "i24 News": "i24NEWS",
  internal: "סקר פנימי",
};

const SCENARIOS_HE: Record<string, string> = {
  "Bennett, Cohen, Gallant, Hendel, and Sa'ar parties, Labor–Meretz merger":
    "מפלגות בנט, כהן, גלנט, הנדל וסער; מיזוג העבודה–מרצ",
  "Bennett–Yashar–Yesh Atid, BW–Reservists, RZ–Otzma mergers, Joint List":
    "מיזוגי בנט–ישר–יש עתיד, כחול לבן–המילואימניקים, הציונות הדתית–עוצמה; רשימה משותפת",
  "Bennett–Yisrael Beiteinu merger": "מיזוג בנט–ישראל ביתנו",
  "Dedi Simchi party with B&W, Hili Tropper party and NEP with Reservists":
    "מפלגת דדי שמחי עם כחול לבן, מפלגת חילי טרופר והמפלגה הכלכלית עם המילואימניקים",
  "Eisenkot leads National Unity": "איזנקוט בראש המחנה הממלכתי",
  "Hendel–Bennett merger": "מיזוג הנדל–בנט",
  "Hili Tropper joins Yashar": "חילי טרופר מצטרף לישר",
  "Joint Ofer Winter, Netali Shem Tov, Yoseph Haddad and Lali Deri party":
    "מפלגה משותפת לעופר וינטר, נטלי שם טוב, יוסף חדאד ולאלי דרעי",
  "Likud B, Benjamin Netanyahu, Ofer Winter parties and Reservists-B&W merger":
    "ליכוד ב', מפלגות בנימין נתניהו ועופר וינטר; מיזוג המילואימניקים–כחול לבן",
  "Likud leadership": "ראשות הליכוד",
  "Likud leadership, Bennett party, Labor–Meretz merger":
    "ראשות הליכוד, מפלגת בנט, מיזוג העבודה–מרצ",
  "Netanyahu retirement": "פרישת נתניהו",
  "New Hope–Yisrael Beiteinu right-wing party":
    "מפלגת ימין תקווה חדשה–ישראל ביתנו",
  "New Hope–Yisrael Beiteinu–Bennett–Cohen, National Unity–Yesh Atid, Labor–Meretz mergers":
    "מיזוגי תקווה חדשה–ישראל ביתנו–בנט–כהן, המחנה הממלכתי–יש עתיד, העבודה–מרצ",
  "Reform protest party, right-wing liberal party":
    "מפלגת מחאה נגד הרפורמה ומפלגה ליברלית-ימנית",
  "Together-Yashar-Tropper, Blue & White-Unity, RZP-Amcha Yisrael, Segalovitz-Ra'am mergers":
    "מיזוגי ביחד–ישר–טרופר, כחול לבן–האחדות, הציונות הדתית–עמך ישראל, סגלוביץ'–רע\"ם",
  "Together–Yashar–Beiteinu mergers": "מיזוגי ביחד–ישר–ביתנו",
  "Unity-Reservists-B&W merger": "מיזוג האחדות–המילואימניקים–כחול לבן",
  "Yariv Levin party": "מפלגת יריב לוין",
  "Yoav Segalovitz joins Ra'am": "יואב סגלוביץ' מצטרף לרע\"ם",
};

const EVENTS_HE: Record<string, string> = {
  'Ofer Winter forms a new political party, called "People of Israel"':
    'עופר וינטר מקים מפלגה חדשה בשם "עמך ישראל"',
  "Ra'am conducts a primary to select candidates for the election":
    "רע\"ם עורכת פריימריז לבחירת מועמדיה",
  "Hadash, Ta'al and Balad re-form the Joint List":
    "חד\"ש, תע\"ל ובל\"ד מקימות מחדש את הרשימה המשותפת",
  "Likud conducts a primary to select candidates for the election":
    "הליכוד עורך פריימריז לבחירת מועמדיו",
  "Ta'al withdraws from Joint List negotiations after being given the fewest seats on the proposed list":
    "תע\"ל פורשת מהמשא ומתן על הרשימה המשותפת לאחר שהוקצו לה הכי מעט מקומות",
  "Gilad Erdan and Yuli Edelstein form a new political party, named Unity":
    "גלעד ארדן ויולי אדלשטיין מקימים מפלגה חדשה בשם האחדות",
  "The Democrats conduct a primary to select candidates for the election":
    "הדמוקרטים עורכים פריימריז לבחירת מועמדיהם",
  "The Knesset approves its dissolution": "הכנסת מאשרת את פיזורה",
  'Yoaz Hendel of The Reservists runs jointly with Hili Tropper under the eventual name "Zionist Home – The Reservists"':
    'יועז הנדל מהמילואימניקים חובר לחילי טרופר ברשימה שתיקרא "הבית הציוני – המילואימניקים"',
  "The Islamabad Memorandum is signed, which aims to end the 2026 Iran war":
    "נחתם מזכר איסלמאבאד שנועד לסיים את מלחמת איראן 2026",
  "Hadash–Ta'al and Balad commit to re-form the Joint List and end negotiations with Ra'am":
    "חד\"ש-תע\"ל ובל\"ד מתחייבות להקים מחדש את הרשימה המשותפת ומסיימות את המשא ומתן עם רע\"ם",
  "Former Hadash MK Yousef Jabareen is chosen to lead the party's electoral list":
    "ח\"כ לשעבר יוסף ג'בארין נבחר לעמוד בראש רשימת חד\"ש",
  "The coalition and opposition submit Knesset dissolution bills, aiming to bring the election date forward":
    "הקואליציה והאופוזיציה מגישות הצעות חוק לפיזור הכנסת במטרה להקדים את הבחירות",
  "Bennett 2026 and Yesh Atid form the Together alliance under Bennett's leadership":
    "בנט 2026 ויש עתיד מקימות את רשימת ביחד בראשות בנט",
  "2026 Israel–Lebanon ceasefire goes into effect":
    "הפסקת האש בין ישראל ללבנון נכנסת לתוקף",
  "A new budget is passed, avoiding a snap election":
    "התקציב החדש מאושר ומונע בחירות מוקדמות",
  "Start of the 2026 Lebanon war": "פרוץ מלחמת לבנון 2026",
  "Start of the 2026 Iran war": "פרוץ מלחמת איראן 2026",
  "Ra'am, Hadash–Ta'al, and Balad publicly commit to re-establish the Joint List":
    "רע\"ם, חד\"ש-תע\"ל ובל\"ד מתחייבות פומבית להקים מחדש את הרשימה המשותפת",
  "A ceasefire between Israel and Hamas is signed and goes into effect":
    "הפסקת אש בין ישראל לחמאס נחתמת ונכנסת לתוקף",
  "Shas withdraws from the government, but remains part of the coalition":
    "ש\"ס פורשת מהממשלה אך נשארת בקואליציה",
  "United Torah Judaism withdraws from the government":
    "יהדות התורה פורשת מהממשלה",
  "National Unity reverts to its former name, Blue and White":
    "המחנה הממלכתי חוזר לשמו הקודם, כחול לבן",
  "Gadi Eisenkot announces that he will leave National Unity and resign from Knesset":
    "גדי איזנקוט מודיע על פרישתו מהמחנה הממלכתי ומהכנסת",
  "Start of the Twelve-Day War": "פרוץ מלחמת שנים עשר הימים",
  "Bennett 2026 is registered as a party": "בנט 2026 נרשמת כמפלגה",
  "Otzma Yehudit rejoins the government": "עוצמה יהודית שבה לממשלה",
  "New Hope merges with Likud for the 2026 election":
    "תקווה חדשה מתמזגת עם הליכוד לקראת בחירות 2026",
  "Otzma Yehudit leaves the government; maintaining continued support from outside the coalition; Otzma gains a seat and Mafdal loses one due to the Norwegian law":
    "עוצמה יהודית עוזבת את הממשלה אך תומכת מבחוץ; עוצמה מקבלת מנדט והמפד\"ל מאבדת אחד בעקבות החוק הנורווגי",
  "New Hope rejoins the government": "תקווה חדשה שבה לממשלה",
  "Delegates from Labor and Meretz approve a merger and form The Democrats":
    "צירי העבודה ומרצ מאשרים את המיזוג ומקימים את הדמוקרטים",
  "National Unity leaves the government": "המחנה הממלכתי עוזב את הממשלה",
  "Yair Golan is elected leader of the Labor Party":
    "יאיר גולן נבחר ליו\"ר מפלגת העבודה",
  "Yair Lapid wins reelection as leader of Yesh Atid":
    "יאיר לפיד נבחר מחדש ליו\"ר יש עתיד",
  "New Hope leaves the government": "תקווה חדשה עוזבת את הממשלה",
  "New Hope splits from National Unity": "תקווה חדשה מתפצלת מהמחנה הממלכתי",
  "2024 Israeli municipal elections": "הבחירות לרשויות המקומיות 2024",
  "National Unity joins an emergency wartime government and the Israeli war cabinet":
    "המחנה הממלכתי מצטרף לממשלת החירום ולקבינט המלחמה",
  "October 7 attacks; the Gaza war begins":
    "מתקפת 7 באוקטובר; פרוץ המלחמה בעזה",
  "The Religious Zionist Party and The Jewish Home merge":
    "הציונות הדתית והבית היהודי מתמזגות",
  "The thirty-seventh government of Israel is sworn in":
    "ממשלת ישראל ה-37 מושבעת",
};

export const firmHe = (s: string | null) => (s ? FIRMS_HE[s] ?? s : "–");
export const publisherHe = (s: string | null) =>
  s ? PUBLISHERS_HE[s] ?? s : "–";
export const scenarioHe = (s: string) => SCENARIOS_HE[s] ?? s;
export const eventHe = (s: string) => EVENTS_HE[s] ?? s;
