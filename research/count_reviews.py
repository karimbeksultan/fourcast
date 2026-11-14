"""Reproduce the counts in research/reviews.md.

Downloads the 500 most recent US App Store reviews of Klarna, Afterpay, Affirm and Zip from Apple's
public review feed and counts complaint themes by keyword. Section 1 of reviews.md was then checked by
hand: keyword hits are candidates, not verified complaints. Run: python research/count_reviews.py
"""
import json
import re
import urllib.request

APPS = {"klarna": 1115120118, "afterpay": 1401019110, "affirm": 967040652, "zip": 1425045070}
FEED = "https://itunes.apple.com/us/rss/customerreviews/page={page}/id={app}/sortby=mostrecent/json"

THEMES = {
    "Customer service": r"customer service|customer support|\bsupport\b|representative|\bagent\b|\bchat\b",
    "Declined purchase or cut spending limit": r"declin|purchas(e|ing) power|spending power|\blimit\b|won'?t let me (use|buy|make)|approved for",
    "Account closed, frozen or fraud": r"fraud|identity|clos(ed|ing) (my )?account|frozen|freez|suspend|locked",
    "App bugs or a bad update": r"crash|glitch|\bbug|update|can'?t log|won'?t load|loading",
    "Payment side (candidates, checked by hand)": r"late fee|late charge|autopay|auto[- ]pay|automatic payment|payments? (keep )?fail|charged (me )?(twice|early|again)|double charg|before (the )?(payment )?due date|overdr|over ?draft|\bnsf\b|bank fee|applied incorrectly|can'?t (make|submit) (a |any |my )?payment|caused me to be late",
}
PAYCHECK = r"pay ?check|pay ?day|get paid|got paid|budget"


def reviews():
    seen = set()
    for name, app in APPS.items():
        for page in range(1, 11):
            with urllib.request.urlopen(FEED.format(page=page, app=app), timeout=20) as res:
                entries = json.load(res).get("feed", {}).get("entry", []) or []
            for e in entries:
                if "im:rating" not in e or e["id"]["label"] in seen:
                    continue  # the first entry can be the app itself
                seen.add(e["id"]["label"])
                yield {
                    "app": name,
                    "rating": int(e["im:rating"]["label"]),
                    "text": f"{e['title']['label']} {e['content']['label']}",
                }


def main():
    rows = list(reviews())
    low = [r for r in rows if r["rating"] <= 2]
    print(f"reviews: {len(rows)}, rated 1-2: {len(low)}")
    for theme, pattern in THEMES.items():
        hits = [r for r in low if re.search(pattern, r["text"], re.I)]
        by_app = {a: sum(r["app"] == a for r in hits) for a in APPS}
        print(f"{len(hits):4d}  {theme}  {by_app}")
    fans = [r for r in rows if re.search(PAYCHECK, r["text"], re.I)]
    print(f"mention paycheck/payday/budget: {len(fans)}, rated 4-5: {sum(r['rating'] >= 4 for r in fans)}")


if __name__ == "__main__":
    main()
