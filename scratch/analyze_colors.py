import os
import xml.etree.ElementTree as ET
from collections import Counter

def analyze_extracted_svgs(extracted_dir):
    files = sorted([f for f in os.listdir(extracted_dir) if f.endswith('.svg')])
    print(f"Analyzing {len(files)} extracted SVGs in {extracted_dir}:\n")
    
    for f in files:
        path = os.path.join(extracted_dir, f)
        tree = ET.parse(path)
        root = tree.getroot()
        
        # Find all paths
        ns = {'svg': 'http://www.w3.org/2000/svg'}
        paths = root.findall('.//svg:path', ns)
        if not paths:
            paths = root.findall('.//path')
            
        fills = []
        strokes = []
        for p in paths:
            fill = p.get('fill')
            if fill:
                fills.append(fill)
            stroke = p.get('stroke')
            if stroke:
                strokes.append(stroke)
                
        fill_counts = Counter(fills)
        stroke_counts = Counter(strokes)
        
        fill_str = ", ".join([f"{c}: {n}" for c, n in fill_counts.most_common(3)])
        stroke_str = ", ".join([f"{c}: {n}" for c, n in stroke_counts.most_common(3)])
        
        print(f"File: {f}")
        print(f"  Paths count: {len(paths)}")
        if fill_counts:
            print(f"  Fills: {fill_str}")
        if stroke_counts:
            print(f"  Strokes: {stroke_str}")

if __name__ == '__main__':
    analyze_extracted_svgs(r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\scratch\extracted_svgs")
