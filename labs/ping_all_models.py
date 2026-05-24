"""
labs/ping_all_models.py
從 CF Workers AI catalog 撈所有 text-generation 模型、各打一發、看誰活誰死。

用法：python labs/ping_all_models.py
輸出：labs/ping_all_results.json + console table
"""

import os
import sys
import time
import json
from pathlib import Path

import requests
from dotenv import load_dotenv

if sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

load_dotenv(Path(__file__).parent / ".env")
ACCOUNT_ID = os.environ["CF_ACCOUNT_ID"]
API_TOKEN = os.environ["CF_API_TOKEN"]

BASE = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai"
HEADERS = {"Authorization": f"Bearer {API_TOKEN}"}


def list_models():
    """撈所有 text-generation 模型。"""
    url = f"{BASE}/models/search"
    all_models = []
    page = 1
    while True:
        r = requests.get(url, headers=HEADERS, params={"page": page, "per_page": 50}, timeout=30)
        r.raise_for_status()
        data = r.json()
        result = data.get("result", [])
        if not result:
            break
        all_models.extend(result)
        if len(result) < 50:
            break
        page += 1
    return all_models


def ping(model_id: str):
    url = f"{BASE}/run/{model_id}"
    payload = {
        "messages": [
            {"role": "system", "content": "回一句中文即可。"},
            {"role": "user", "content": "便當 90"},
        ],
        "temperature": 0,
        "max_tokens": 128,
    }
    t0 = time.time()
    try:
        r = requests.post(url, headers=HEADERS, json=payload, timeout=60)
        dt = int((time.time() - t0) * 1000)
        if r.status_code != 200:
            return {"ok": False, "status": r.status_code, "ms": dt, "err": r.text[:160]}
        data = r.json()
        if not data.get("success"):
            return {"ok": False, "status": 200, "ms": dt, "err": str(data.get("errors"))[:160]}
        result = data.get("result", {})
        resp = result.get("response", "") or json.dumps(result, ensure_ascii=False)[:120]
        usage = result.get("usage", {})
        return {"ok": True, "status": 200, "ms": dt, "resp": resp[:120], "usage": usage}
    except Exception as e:
        dt = int((time.time() - t0) * 1000)
        return {"ok": False, "status": "EXC", "ms": dt, "err": str(e)[:160]}


def main():
    print("撈 catalog...")
    models = list_models()
    text_models = [m for m in models if m.get("task", {}).get("name", "").lower() in ("text generation", "text-generation")]
    print(f"總模型 {len(models)}、其中 text generation {len(text_models)}\n")

    results = []
    print(f"{'#':<3} {'模型 ID':<60} {'狀態':<6} {'ms':>6}  回應 / 錯誤")
    print("-" * 140)
    for i, m in enumerate(text_models, 1):
        mid = m["name"]
        res = ping(mid)
        results.append({"name": mid, "description": m.get("description", "")[:80], **res})
        if res["ok"]:
            tail = res["resp"].replace("\n", " ")
            print(f"{i:<3} {mid:<60} {'OK':<6} {res['ms']:>6}  {tail[:60]}")
        else:
            print(f"{i:<3} {mid:<60} {'FAIL':<6} {res['ms']:>6}  [{res['status']}] {res['err'][:60]}")

    out = Path(__file__).parent / "ping_all_results.json"
    out.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    alive = sum(1 for r in results if r["ok"])
    print(f"\n存活：{alive}/{len(text_models)}")
    print(f"完整結果：{out}")


if __name__ == "__main__":
    main()
