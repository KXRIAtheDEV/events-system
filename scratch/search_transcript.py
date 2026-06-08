import json

transcript_path = r"C:\Users\bradr\.gemini\antigravity\brain\3c84c89f-2fc3-4c0e-b532-099d7bab2cbe\.system_generated\logs\transcript.jsonl"
target_lines = [1713, 1715]

with open(transcript_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if i in target_lines:
            try:
                data = json.loads(line)
                print(f"--- LINE {i} ---")
                print(data.get("content", ""))
            except Exception as e:
                print(f"Error reading line {i}: {e}")
