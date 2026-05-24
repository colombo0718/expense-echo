"""
labs/ping_models.py
對 labs/engines.json 鎖定的 8 個模型各打一發、確認回得了中文。
支援 legacy schema（result.response）+ OpenAI compat schema（result.choices[0].message.content）。

用法：python labs/ping_models.py
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

ENDPOINT = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run"
HEADERS = {"Authorization": f"Bearer {API_TOKEN}"}

ENGINES = json.loads((Path(__file__).parent / "engines.json").read_text(encoding="utf-8"))["engines"]


def extract_response(result: dict) -> tuple[str, str]:
    """回傳 (response_text, schema_detected)。"""
    if isinstance(result, dict) and "choices" in result:
        try:
            return result["choices"][0]["message"]["content"] or "", "openai"
        except (KeyError, IndexError, TypeError):
            return "", "openai-malformed"
    if isinstance(result, dict) and "response" in result:
        return result.get("response", "") or "", "legacy"
    return "", "unknown"


def extract_usage(result: dict) -> dict:
    if isinstance(result, dict):
        return result.get("usage", {}) or {}
    return {}


def ping(model_id: str, prompt: str = "便當 90、用繁體中文回一句、確認你聽得懂"):
    url = f"{ENDPOINT}/{model_id}"
    payload = {
        "messages": [
            {"role": "system", "content": "你是中文助理、用繁體中文簡短回應。"},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0,
        "max_tokens": 256,
    }
    t0 = time.time()
    try:
        r = requests.post(url, headers=HEADERS, json=payload, timeout=90)
        dt = int((time.time() - t0) * 1000)
        if r.status_code != 200:
            return {"ok": False, "status": r.status_code, "ms": dt, "err": r.text[:200]}
        data = r.json()
        if not data.get("success"):
            return {"ok": False, "status": 200, "ms": dt, "err": str(data.get("errors"))[:200]}
        result = data.get("result", {})
        text, schema = extract_response(result)
        usage = extract_usage(result)
        return {"ok": True, "status": 200, "ms": dt, "resp": text, "schema": schema, "usage": usage}
    except Exception as e:
        dt = int((time.time() - t0) * 1000)
        return {"ok": False, "status": "EXC", "ms": dt, "err": str(e)[:200]}


def main():
    print(f"{'#':<3} {'公司':<10} {'規模':<6} {'schema':<10} {'狀態':<6} {'ms':>6}  回應")
    print("-" * 130)
    results = []
    for i, eng in enumerate(ENGINES, 1):
        res = ping(eng["model"])
        record = {**eng, **res}
        results.append(record)
        size = f"{eng['params_b']}B" if eng["params_b"] < 1000 else "1T"
        if res["ok"]:
            tail = res["resp"].replace("\n", " ").strip()
            schema_tag = res["schema"]
            print(f"{i:<3} {eng['company']:<10} {size:<6} {schema_tag:<10} {'OK':<6} {res['ms']:>6}  {tail[:80]}")
        else:
            print(f"{i:<3} {eng['company']:<10} {size:<6} {'-':<10} {'FAIL':<6} {res['ms']:>6}  [{res['status']}] {res['err'][:60]}")

    out = Path(__file__).parent / "ping_results.json"
    out.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    alive = sum(1 for r in results if r["ok"])
    print(f"\n存活：{alive}/{len(ENGINES)}、寫入 {out.name}")


if __name__ == "__main__":
    main()
