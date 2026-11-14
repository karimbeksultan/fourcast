import type { MetadataRoute } from "next";

// Static on purpose: no dates, no request data, so it is built once.
const BASE = "https://fourcast-zimran.vercel.app";
const PAGES = ["/", "/plans", "/tonight", "/timeline", "/check", "/dispute", "/pricing", "/faq"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((path) => ({ url: `${BASE}${path}`, priority: path === "/" ? 1 : 0.6 }));
}
