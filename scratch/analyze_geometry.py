import os
import re
import xml.etree.ElementTree as ET

def analyze_svg_geometry(extracted_dir):
    files = sorted([f for f in os.listdir(extracted_dir) if f.endswith('.svg')])
    print("Geometry analysis of extracted SVGs:")
    print(f"{'Filename':<20} | {'Paths':<5} | {'Curves (C/S)':<12} | {'Arcs (A)':<8} | {'Lines (L/H/V)':<13} | {'Avg Coord Count':<15}")
    print("-" * 85)
    
    for f in files:
        path = os.path.join(extracted_dir, f)
        tree = ET.parse(path)
        root = tree.getroot()
        
        paths = root.findall('.//path')
        if not paths:
            ns = {'svg': 'http://www.w3.org/2000/svg'}
            paths = root.findall('.//svg:path', ns)
            
        curve_count = 0
        arc_count = 0
        line_count = 0
        coord_counts = []
        
        for p in paths:
            d = p.get('d', '')
            if not d:
                continue
                
            # Count command types
            curves = len(re.findall(r'[cCsSqQtT]', d))
            arcs = len(re.findall(r'[aA]', d))
            lines = len(re.findall(r'[lLhHvV]', d))
            
            curve_count += curves
            arc_count += arcs
            line_count += lines
            
            coords = len(re.findall(r'[-+]?\d*\.\d+|[-+]?\d+', d))
            coord_counts.append(coords)
            
        avg_coords = sum(coord_counts) / len(coord_counts) if coord_counts else 0
        print(f"{f:<20} | {len(paths):<5} | {curve_count:<12} | {arc_count:<8} | {line_count:<13} | {avg_coords:<15.1f}")

if __name__ == '__main__':
    analyze_svg_geometry(r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\scratch\extracted_svgs")
