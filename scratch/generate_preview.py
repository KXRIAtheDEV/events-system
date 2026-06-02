import os

def generate_preview_html(extracted_dir, output_file):
    files = sorted([f for f in os.listdir(extracted_dir) if f.endswith('.svg')])
    
    html = """<!DOCTYPE html>
<html>
<head>
    <title>SVG Icons Preview</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #121212;
            color: #ffffff;
            margin: 20px;
        }
        h1, h2 {
            text-align: center;
            color: #FF6B00;
        }
        .container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 20px;
            padding: 20px;
        }
        .card {
            background: #1e1e1e;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 15px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .card:hover {
            transform: translateY(-5px);
            border-color: #FF6B00;
            box-shadow: 0 8px 15px rgba(255,107,0,0.2);
        }
        .icon-container {
            width: 128px;
            height: 128px;
            margin: 0 auto 15px auto;
            background: #2a2a2a;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
        }
        .icon-container svg, .icon-container img {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
        }
        .title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #e0e0e0;
        }
        .details {
            font-size: 11px;
            color: #888;
        }
    </style>
</head>
<body>
    <h1>EventsHub Custom Vector Icons Preview</h1>
    <p style="text-align:center; color:#aaa;">Open this page in a browser to view all sliced custom vector SVGs from the two sprite sheets.</p>
    
    <h2>Sheet 1 Icons</h2>
    <div class="container">
    """
    
    # Sheet 1
    sheet1_files = [f for f in files if f.startswith('sheet1')]
    for f in sheet1_files:
        path = os.path.join(extracted_dir, f)
        # Read the SVG file content to embed it inline
        with open(path, 'r', encoding='utf-8') as svg_file:
            svg_content = svg_file.read()
            # Remove XML declaration if present
            svg_content = svg_content.replace('<?xml version="1.0" encoding="utf-8" ?>', '')
            svg_content = svg_content.replace('<?xml version="1.0" encoding="utf-8"?>', '')
            
        html += f"""
        <div class="card">
            <div class="icon-container">
                {svg_content}
            </div>
            <div class="title">{f}</div>
            <div class="details">Grid Coordinates: Row {f.split('_')[1][1]}, Col {f.split('_')[2][1]}</div>
        </div>
        """
        
    html += """
    </div>
    <h2>Sheet 2 Icons</h2>
    <div class="container">
    """
    
    # Sheet 2
    sheet2_files = [f for f in files if f.startswith('sheet2')]
    for f in sheet2_files:
        path = os.path.join(extracted_dir, f)
        # Read the SVG file content to embed it inline
        with open(path, 'r', encoding='utf-8') as svg_file:
            svg_content = svg_file.read()
            # Remove XML declaration if present
            svg_content = svg_content.replace('<?xml version="1.0" encoding="utf-8" ?>', '')
            svg_content = svg_content.replace('<?xml version="1.0" encoding="utf-8"?>', '')
            
        html += f"""
        <div class="card">
            <div class="icon-container">
                {svg_content}
            </div>
            <div class="title">{f}</div>
            <div class="details">Grid Coordinates: Row {f.split('_')[1][1]}, Col {f.split('_')[2][1]}</div>
        </div>
        """
        
    html += """
    </div>
</body>
</html>
"""
    
    with open(output_file, 'w', encoding='utf-8') as out:
        out.write(html)
        
    print(f"Generated HTML preview page at: {output_file}")

if __name__ == '__main__':
    generate_preview_html(r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\scratch\extracted_svgs",
                          r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\scratch\icon_preview.html")
