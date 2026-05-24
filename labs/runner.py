"""
labs/runner.py — Stage 1 evaluation runner

讀 engines.json + samples.json + harness/l0.py、跑 120 × 8 = 960 runs、輸出 JSONL。

用法：
  python labs/runner.py                  # 跑全部
  python labs/runner.py --engine Meta    # 只跑某 engine
  python labs/runner.py --type T1        # 只跑某 type
  python labs/runner.py --limit 5        # 每 engine 只跑前 5 條（debug 用）

輸出：labs/runs/L0_<timestamp>.jsonl、每行一筆 run record
"""

import os
import sys
import time
import json
import argparse
from pathlib import Path
from datetime import datetime

import requests
from dotenv import load_dotenv

if sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

LABS = Path(__file__).parent
sys.path.insert(0, str(LABS))
from harness.l0 import build_messages  # noqa: E402

load_dotenv(LABS / ".env")
ACCOUNT_ID = os.environ["CF_ACCOUNT_ID"]
API_TOKEN = os.environ["CF_API_TOKEN"]
ENDPOINT = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run"
HEADERS = {"Authorization": f"Bearer {API_TOKEN}"}


def extract_response(result: dict) -> str:
    """支援 legacy + OpenAI compat 兩種 schema。"""
    if not isinstance(result, dict):
        return ""
    if "choices" in result:
        try:
            return result["choices"][0]["message"]["content"] or ""
        except (KeyError, IndexError, TypeError):
            return ""
    return result.get("response", "") or ""


def extract_usage(result: dict) -> dict:
    return result.get("usage", {}) if isinstance(result, dict) else {}


def try_parse_json(raw: str) -> tuple[dict | None, str | None]:
    """從 LLM raw 回應裡盡力 parse 出 JSON。回 (parsed | None, error_kind | None)。"""
    if not raw:
        return None, "empty"
    s = raw.strip()
    # 砍 thinking 標籤
    if "<think>" in s and "</think>" in s:
        s = s.split("</think>", 1)[1].strip()
    # 砍 markdown code fence
    if s.startswith("```"):
        s = s.split("```", 2)[1] if s.count("```") >= 2 else s[3:]
        if s.startswith("json"):
            s = s[4:]
        s = s.strip()
        if s.endswith("```"):
            s = s[:-3].strip()
    # 抓第一個 { 到最後一個 }
    if "{" in s and "}" in s:
        s = s[s.index("{"): s.rindex("}") + 1]
    try:
        return json.loads(s), None
    except json.JSONDecodeError as e:
        return None, f"json_decode:{e.msg[:60]}"


def run_one(engine: dict, sample: dict, timeout: int = 90) -> dict:
    messages = build_messages(sample["input"])
    payload = {"messages": messages, "temperature": 0, "max_tokens": 512}
    url = f"{ENDPOINT}/{engine['model']}"
    t0 = time.time()
    record = {
        "harness": "L0",
        "engine_company": engine["company"],
        "engine_model": engine["model"],
        "engine_params_b": engine["params_b"],
        "sample_id": sample["id"],
        "sample_type": sample["type"],
        "input": sample["input"],
        "ground_truth": sample["ground_truth"],
        "ts": datetime.utcnow().isoformat() + "Z",
    }
    try:
        r = requests.post(url, headers=HEADERS, json=payload, timeout=timeout)
        record["latency_ms"] = int((time.time() - t0) * 1000)
        record["http_status"] = r.status_code
        if r.status_code != 200:
            record["ok"] = False
            record["error"] = r.text[:300]
            record["raw_response"] = ""
            record["parsed"] = None
            record["parse_error"] = "http"
            return record
        data = r.json()
        if not data.get("success"):
            record["ok"] = False
            record["error"] = str(data.get("errors"))[:300]
            record["raw_response"] = ""
            record["parsed"] = None
            record["parse_error"] = "cf_error"
            return record
        result = data.get("result", {})
        raw = extract_response(result)
        usage = extract_usage(result)
        parsed, parse_err = try_parse_json(raw)
        record["ok"] = True
        record["raw_response"] = raw
        record["parsed"] = parsed
        record["parse_error"] = parse_err
        record["usage"] = usage
        return record
    except Exception as e:
        record["latency_ms"] = int((time.time() - t0) * 1000)
        record["http_status"] = "EXC"
        record["ok"] = False
        record["error"] = str(e)[:300]
        record["raw_response"] = ""
        record["parsed"] = None
        record["parse_error"] = "exception"
        return record


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine", help="只跑某公司（Meta / IBM / Google / ...）")
    ap.add_argument("--type", help="只跑某題型（T1..T12）")
    ap.add_argument("--limit", type=int, help="每 engine 只跑前 N 條（debug 用）")
    ap.add_argument("--out", help="輸出 JSONL 路徑、預設 labs/runs/L0_<ts>.jsonl")
    args = ap.parse_args()

    engines = json.loads((LABS / "engines.json").read_text(encoding="utf-8"))["engines"]
    samples = json.loads((LABS / "samples.json").read_text(encoding="utf-8"))["samples"]

    if args.engine:
        engines = [e for e in engines if e["company"].lower() == args.engine.lower()]
    if args.type:
        samples = [s for s in samples if s["type"] == args.type]
    if args.limit:
        samples = samples[: args.limit]

    runs_dir = LABS / "runs"
    runs_dir.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    out_path = Path(args.out) if args.out else runs_dir / f"L0_{ts}.jsonl"

    total = len(engines) * len(samples)
    print(f"L0 runner：{len(engines)} engine × {len(samples)} sample = {total} runs")
    print(f"輸出：{out_path}\n")

    t_start = time.time()
    done = 0
    fails = 0
    parse_fails = 0

    with out_path.open("w", encoding="utf-8") as f:
        for eng in engines:
            print(f"\n=== {eng['company']:<10} {eng['model']} ===")
            eng_ok = 0
            eng_parsefail = 0
            for s in samples:
                rec = run_one(eng, s)
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
                f.flush()
                done += 1
                if not rec["ok"]:
                    fails += 1
                    mark = "✗"
                elif rec.get("parse_error"):
                    parse_fails += 1
                    eng_parsefail += 1
                    mark = "?"
                else:
                    eng_ok += 1
                    mark = "✓"
                progress = f"[{done}/{total}]"
                elapsed = int(time.time() - t_start)
                print(f"  {mark} {s['id']:<8} {rec.get('latency_ms','-'):>5}ms  {progress} ({elapsed}s)")
            print(f"  小計：{eng_ok} 解析成功 / {eng_parsefail} JSON 壞 / {len(samples)-eng_ok-eng_parsefail} HTTP/exception 失敗")

    elapsed = int(time.time() - t_start)
    print(f"\n完成、耗時 {elapsed}s / {elapsed//60}m{elapsed%60}s")
    print(f"統計：{done - fails - parse_fails} 解析成功 / {parse_fails} JSON 壞 / {fails} HTTP 或 exception 失敗")
    print(f"原始記錄：{out_path}")


if __name__ == "__main__":
    main()
