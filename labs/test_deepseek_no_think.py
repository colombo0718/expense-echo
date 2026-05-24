"""
labs/test_deepseek_no_think.py
試 4 種方式關掉 DeepSeek-R1 thinking、看哪個有效。
"""
import os, sys, time, json
from pathlib import Path
import requests
from dotenv import load_dotenv

if sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

load_dotenv(Path(__file__).parent / ".env")
ACCOUNT_ID = os.environ["CF_ACCOUNT_ID"]
TOKEN = os.environ["CF_API_TOKEN"]

MODEL = "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b"
URL = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/{MODEL}"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

USER = "便當 90"

CASES = [
    ("baseline 不處理", [
        {"role": "system", "content": "你是中文助理。"},
        {"role": "user", "content": USER},
    ]),
    ("system prompt 禁止", [
        {"role": "system", "content": "你是中文助理。請直接回答、不要輸出 <think> 標籤、不要展示推理過程。"},
        {"role": "user", "content": USER},
    ]),
    ("assistant pre-fill <think></think>", [
        {"role": "system", "content": "你是中文助理。"},
        {"role": "user", "content": USER},
        {"role": "assistant", "content": "<think>\n\n</think>\n\n"},
    ]),
    ("組合 (system 禁止 + pre-fill)", [
        {"role": "system", "content": "你是中文助理。請直接回答、不要輸出 <think> 標籤。"},
        {"role": "user", "content": USER},
        {"role": "assistant", "content": "<think>\n\n</think>\n\n"},
    ]),
]


def run(messages):
    t0 = time.time()
    r = requests.post(URL, headers=HEADERS, json={
        "messages": messages, "temperature": 0, "max_tokens": 512,
    }, timeout=120)
    dt = int((time.time() - t0) * 1000)
    if r.status_code != 200:
        return {"ms": dt, "err": r.text[:200]}
    data = r.json().get("result", {})
    resp = data.get("response", "")
    usage = data.get("usage", {})
    has_think = "<think>" in resp
    return {"ms": dt, "tokens": usage.get("completion_tokens", 0), "has_think": has_think, "resp": resp}


for name, msgs in CASES:
    print(f"\n=== {name} ===")
    res = run(msgs)
    if "err" in res:
        print(f"  ERR: {res['err']}")
        continue
    print(f"  latency: {res['ms']} ms")
    print(f"  tokens:  {res['tokens']}")
    print(f"  含 <think>: {res['has_think']}")
    print(f"  回應前 200 字: {res['resp'][:200]}")
