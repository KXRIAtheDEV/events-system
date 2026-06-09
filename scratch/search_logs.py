import json
import sys

# Reconfigure stdout to use UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

transcript_path = r"C:\Users\bradr\.gemini\antigravity\brain\edece405-bfee-4c4b-ba4c-fed6ca4e0e12\.system_generated\logs\transcript.jsonl"

user_requests = []
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'USER_INPUT':
                user_requests.append(data)
        except Exception as e:
            pass

# Print the last 10 requests in full, with UTF-8
for data in user_requests[-10:]:
    print("=" * 60)
    print(f"Step {data.get('step_index')}:")
    print(data.get('content'))
    print("=" * 60)
