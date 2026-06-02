import json

def get_user_inputs(transcript_path):
    print(f"Reading user inputs from: {transcript_path}\n")
    with open(transcript_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            try:
                data = json.loads(line)
                if data.get('type') == 'USER_INPUT':
                    print(f"--- Line {line_num} (Source: USER) ---")
                    print(data.get('content'))
                    print()
            except Exception as e:
                pass

if __name__ == '__main__':
    get_user_inputs(r"C:\Users\bradr\.gemini\antigravity\brain\5f8754de-78e3-4c4b-a6f9-f871f0ee8b93\.system_generated\logs\transcript.jsonl")
