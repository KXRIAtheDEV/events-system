import os

frontend_dir = r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\frontend"

conflict_markers = ["<<<<<<<", ">>>>>>>"]
found_conflicts = []

for root, dirs, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith(('.css', '.html', '.js')):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    for i, line in enumerate(f, 1):
                        if any(marker in line for marker in conflict_markers):
                            found_conflicts.append((file_path, i, line.strip()))
            except Exception as e:
                pass

for path, line_no, content in found_conflicts:
    print(f"{path}:{line_no}: {content}")
