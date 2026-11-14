// Calendar file: one all-day event per plan debit with a reminder the evening
// before and a link to the one-number check-in (/?due=YYYY-MM-DD), plus payday events.
import { addDays, formatUSD } from "./dates";
import { paydaysBetween, planDebits, WINDOW_DAYS } from "./plan";
import type { AppState, ISODate } from "./types";

const compact = (date: ISODate) => date.replaceAll("-", "");

function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

/** RFC 5545: a line longer than 75 octets continues on the next line after one space. Counts UTF-8 bytes, never splits a character. */
const utf8 = new TextEncoder();

function fold(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = utf8.encode(char).length;
    if (bytes + size > 75) {
      out.push(current);
      current = " ";
      bytes = 1;
    }
    current += char;
    bytes += size;
  }
  out.push(current);
  return out;
}

export function buildIcs(state: AppState, today: ISODate, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fourcast//Pay in 4 forecast//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Fourcast",
  ];
  const stamp = `${compact(today)}T000000Z`;

  const event = (uid: string, date: ISODate, summary: string, description: string, url: string, alarm: string | null) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}@fourcast`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(date)}`,
      `DTEND;VALUE=DATE:${compact(addDays(date, 1))}`,
      `SUMMARY:${escapeText(summary)}`,
      `DESCRIPTION:${escapeText(description)}`,
      `URL:${url}`,
      "TRANSP:TRANSPARENT",
    );
    if (alarm) {
      // All-day events start at midnight: -PT4H fires at 8 pm the evening before.
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "TRIGGER;RELATED=START:-PT4H",
        `DESCRIPTION:${escapeText(alarm)}`,
        "END:VALARM",
      );
    }
    lines.push("END:VEVENT");
  };

  for (const plan of state.plans) {
    for (const date of planDebits(plan, today)) {
      const amount = formatUSD(plan.installment);
      const where = plan.merchant ? ` (${plan.merchant})` : "";
      const url = `${base}/?due=${date}`;
      event(
        `${plan.id}-${date}`,
        date,
        `${plan.lender} takes ${amount}${where}`,
        `${plan.lender} takes ${amount} today. The night before, check in with what's in checking: ${url}`,
        url,
        `Tomorrow ${plan.lender} takes ${amount}. What's in checking? ${url}`,
      );
    }
  }

  for (const date of paydaysBetween(state.money, today, addDays(today, WINDOW_DAYS - 1))) {
    const url = `${base}/timeline`;
    event(`payday-${date}`, date, "Payday: see what's really yours", `Your next 6 weeks: ${url}`, url, null);
  }

  lines.push("END:VCALENDAR");
  return lines.flatMap(fold).join("\r\n") + "\r\n";
}
