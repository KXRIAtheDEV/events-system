import json

def search_transcript(transcript_path):
    print(f"Searching transcript: {transcript_path}")
    count = 0
    with open(transcript_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            try:
                data = json.loads(line)
                content = data.get('content', '')
                if not content:
                    continue
                # Search for icon mapping, public, individual, sheet, svg, style-model-mode, etc.
                content_lower = content.lower()
                if 'icons' in content_lower or 'sprite' in content_lower or 'sheet' in content_lower or 'svg' in content_lower:
                    # Let's print out lines containing relevant info
                    if any(term in content_lower for term in ['calendar', 'ticket', 'revenue', 'analytics', 'attendees', 'payouts', 'promotion', 'settings']):
                        print(f"--- Line {line_num} (Source: {data.get('source')}, Type: {data.get('type')}) ---")
                        print(content[:500] + "...")
                        count += 1
                        if count > 10:
                            print("Truncated output after 10 matches.")
                            break
            except Exception as e:
                pass

if __name__ == '__main__':
    search_transcript(r"C:\Users\bradr\.gemini\antigravity\brain\5f8754de-78e3-4c4b-a6f9-f871f0ee8b93\.system_generated\logs\transcript.jsonl")
