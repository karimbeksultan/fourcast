"""Build complaints.csv for the BNPL pain research.

Inputs:
  1. appstore_rows.py: App Store reviews read and coded by hand.
  2. A CFPB Consumer Complaint Database pull (JSON from the public search API), path as argv[1].
     On 15 Nov 2026 the API returned structured fields only (product, issue, sub-issue,
     company response) and no narrative text, so CFPB rows are coded from those fields.
Run: python build_db.py <cfpb_raw.json>
"""
import csv, json, sys
from collections import defaultdict
from pathlib import Path

from appstore_rows import ROWS

HERE = Path(__file__).parent
APP_IDS = {"Klarna": 1115120118, "Afterpay": 1401019110, "Affirm": 967040652, "Zip": 1425045070}
CFPB_URL = "https://www.consumerfinance.gov/data-research/consumer-complaints/search/detail/{}"

# CFPB issue -> (category, summary RU, financial consequence, product opportunity)
ISSUES = {
    "Problem when making payments": ("B;H", "Проблема при внесении платежа", "Риск просрочки/сбора", "Контроль статуса платежей и автоплатежа"),
    "Problem with a purchase shown on your statement": ("D", "Спор о покупке, который компания не решает", "Платёж за спорную покупку", "Трекер споров и возвратов"),
    "Charged fees or interest you didn't expect": ("B", "Неожиданные сборы или проценты", "Сборы", "Предупреждение до просрочки"),
    "Struggling to pay your loan": ("F", "Трудности с погашением займа", "Риск просрочки и долга", "Прогноз нагрузки до зарплаты"),
    "Attempts to collect debt not owed": ("G", "Взыскание долга, который потребитель считает не своим", "Взыскание, риск для кредитной истории", "История платежей как доказательство"),
    "Incorrect information on your report": ("G", "Неверные данные в кредитной истории", "Риск для кредитного рейтинга", "История платежей как доказательство"),
    "Problem with a company's investigation into an existing problem": ("G;E", "Компания не исправила ошибку после расследования", "Нерешённая ошибка", "Шаблон спора и таймер сроков"),
    "Took or threatened to take negative or legal action": ("G", "Угрозы ухудшить кредитную историю или иск", "Давление взыскания", "—"),
    "Getting the loan": ("C", "Проблема с получением займа/одобрением", "Отказ в покупке", "—"),
    "Problem with additional add-on products or services": ("H", "Проблема с дополнительной услугой/подпиской", "Лишние списания", "—"),
    "Unauthorized transactions or other transaction problem": ("H", "Несанкционированная или ошибочная операция", "Ошибочное списание", "Обнаружение дублей/чужих списаний"),
    "Problem with a lender or other company charging your account": ("B;H", "Кредитор списал деньги со счёта с проблемой", "Ошибочное списание", "Сверка списаний"),
    "Problem with the payoff process at the end of the loan": ("H", "Проблема при закрытии займа", "Остаток после погашения", "Сверка остатка"),
    "Problem caused by your funds being low": ("B", "Последствия низкого баланса (овердрафт)", "Овердрафт/NSF", "Прогноз баланса перед списанием"),
    "Can't stop withdrawals from your bank account": ("B", "Не удаётся остановить списания со счёта", "Нежелательные списания", "—"),
    "Money was taken from your bank account on the wrong day or for the wrong amount": ("B", "Деньги списаны не в тот день или не в той сумме", "Ошибочное списание", "Прогноз дат списаний"),
    "False statements or representation": ("G", "Попытка взыскать неверную сумму", "Неверный долг", "Сверка остатка"),
    "Fees or interest": ("B", "Проблема со сборами", "Сборы", "Предупреждение до просрочки"),
    "Problem with customer service": ("E", "Проблема с поддержкой", "—", "—"),
}
PER_PROVIDER = {"Klarna": 18, "Affirm": 18, "Zip": 14, "Sezzle": 14, "Afterpay": 16}

FIELDS = ["ID", "Платформа", "Провайдер", "Дата", "URL", "Резюме жалобы", "Категории",
          "Финансовые последствия", "Эмоциональные последствия", "Обходной путь", "Итог",
          "Качество доказательства", "Возможность для Fourcast", "Оценка", "Источник ID"]


def appstore():
    for i, (app, rid, date, rating, cats, fin, emo, work, res, opp, summ) in enumerate(ROWS, 1):
        yield {"ID": f"AS-{i:03d}", "Платформа": "Apple App Store (US)", "Провайдер": app, "Дата": date,
               "URL": f"https://apps.apple.com/us/app/id{APP_IDS[app]}?see-all=reviews",
               "Резюме жалобы": summ + " (заявление автора отзыва, не проверено)", "Категории": cats,
               "Финансовые последствия": fin, "Эмоциональные последствия": emo, "Обходной путь": work,
               "Итог": res, "Качество доказательства": "Средняя: от первого лица, проверяемый ID отзыва, без подтверждения",
               "Возможность для Fourcast": opp, "Оценка": f"{rating}★", "Источник ID": f"Apple review {rid}"}


def cfpb(path):
    rows = json.load(open(path, encoding="utf-8"))
    rows.sort(key=lambda c: c["date_received"], reverse=True)
    taken = defaultdict(int)
    n = 0
    for c in rows:
        prov, issue = c["_provider"], c["issue"]
        if issue not in ISSUES or taken[prov] >= PER_PROVIDER.get(prov, 0):
            continue
        taken[prov] += 1; n += 1
        cats, summ, fin, opp = ISSUES[issue]
        sub = f"; подтема: {c['sub_issue']}" if c.get("sub_issue") else ""
        resp = c["company_response"]
        res = {"Closed with monetary relief": "Закрыта с денежной компенсацией",
               "Closed with non-monetary relief": "Закрыта с неденежной мерой",
               "Closed with explanation": "Закрыта с объяснением (без компенсации)",
               "In progress": "В работе"}.get(resp, resp)
        yield {"ID": f"CF-{n:03d}", "Платформа": "CFPB Consumer Complaint Database", "Провайдер": prov,
               "Дата": c["date_received"][:10], "URL": CFPB_URL.format(c["complaint_id"]),
               "Резюме жалобы": f"{summ}. Продукт: {c['product']}; тема: {issue}{sub}. Текст жалобы не опубликован.",
               "Категории": cats, "Финансовые последствия": fin, "Эмоциональные последствия": "Неизвестно (нет текста)",
               "Обходной путь": "Жалоба регулятору", "Итог": res,
               "Качество доказательства": "Средняя: официальная жалоба, поля проверяемы, суть со слов потребителя",
               "Возможность для Fourcast": opp, "Оценка": "", "Источник ID": f"CFPB {c['complaint_id']}"}


def main():
    out = list(appstore()) + list(cfpb(sys.argv[1]))
    with open(HERE / "complaints.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, FIELDS); w.writeheader(); w.writerows(out)
    by = defaultdict(int)
    for r in out:
        for c in r["Категории"].split(";"):
            by[c] += 1
    print(len(out), "rows;", dict(sorted(by.items())))


if __name__ == "__main__":
    main()
