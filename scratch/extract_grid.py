import re
import os
import xml.etree.ElementTree as ET

def get_path_bbox(d_attr):
    tokens = re.findall(r'[-+]?\d*\.\d+|\d+', d_attr)
    coords = [float(t) for t in tokens]
    xs = []
    ys = []
    
    commands = re.findall(r'([a-zA-Z])|([-+]?\d*\.\d+|[-+]?\d+)', d_attr)
    nums = []
    for cmd, val in commands:
        if val:
            nums.append(float(val))
            
    if len(nums) >= 2:
        for i in range(0, len(nums) - 1, 2):
            xs.append(nums[i])
            ys.append(nums[i+1])
            
    if not xs or not ys:
        return None
    return min(xs), min(ys), max(xs), max(ys)

def extract_grid_icons(svg_path, output_dir, file_prefix):
    os.makedirs(output_dir, exist_ok=True)
    tree = ET.parse(svg_path)
    root = tree.getroot()
    
    ns = {'svg': 'http://www.w3.org/2000/svg'}
    paths = root.findall('.//svg:path', ns)
    if not paths:
        paths = root.findall('.//path')
        
    print(f"\nProcessing {os.path.basename(svg_path)}")
    
    # We will assume a 4x4 grid of 256x256 cells.
    # Cell columns: 0-256, 256-512, 512-768, 768-1024
    # Cell rows: 0-256, 256-512, 512-768, 768-1024
    grid = {}
    for r in range(4):
        for c in range(4):
            grid[(r, c)] = []
            
    for idx, path in enumerate(paths):
        d = path.get('d')
        if not d:
            continue
        bbox = get_path_bbox(d)
        if not bbox:
            continue
        x1, y1, x2, y2 = bbox
        cx = (x1 + x2) / 2
        cy = (y1 + y2) / 2
        
        # Determine grid cell
        col = int(cx // 256)
        row = int(cy // 256)
        
        # Clamp to 0-3
        col = max(0, min(3, col))
        row = max(0, min(3, row))
        
        grid[(row, col)].append((path, bbox))
        
    # Now write each non-empty grid cell to a new SVG file
    for (r, c), items in grid.items():
        if not items:
            continue
            
        print(f"Cell ({r}, {c}): {len(items)} paths")
        
        # Calculate bounding box of all paths in this cell
        c_xs = []
        c_ys = []
        for path, bbox in items:
            x1, y1, x2, y2 = bbox
            c_xs.extend([x1, x2])
            c_ys.extend([y1, y2])
            
        min_x, max_x = min(c_xs), max(c_xs)
        min_y, max_y = min(c_ys), max(c_ys)
        width = max_x - min_x
        height = max_y - min_y
        
        # Let's add a small padding
        padding = 10
        min_x_pad = max(0.0, min_x - padding)
        min_y_pad = max(0.0, min_y - padding)
        max_x_pad = min(1024.0, max_x + padding)
        max_y_pad = min(1024.0, max_y + padding)
        view_w = max_x_pad - min_x_pad
        view_h = max_y_pad - min_y_pad
        
        # Create a new SVG tree
        new_root = ET.Element('svg', {
            'xmlns': 'http://www.w3.org/2000/svg',
            'viewBox': f"{min_x_pad:.1f} {min_y_pad:.1f} {view_w:.1f} {view_h:.1f}",
            'width': '512',
            'height': '512'
        })
        
        # Copy the paths
        for path, bbox in items:
            # Create a clean copy of the path element
            new_path = ET.SubElement(new_root, 'path')
            for name, value in path.items():
                new_path.set(name, value)
                
        # Write to file
        output_file = os.path.join(output_dir, f"{file_prefix}_r{r}_c{c}.svg")
        new_tree = ET.ElementTree(new_root)
        new_tree.write(output_file, encoding='utf-8', xml_declaration=True)
        print(f"  Saved to {output_file} (viewBox={min_x_pad:.1f} {min_y_pad:.1f} {view_w:.1f} {view_h:.1f})")

if __name__ == '__main__':
    svg1 = r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\public\icons\style-model-mode--vector-art-color-palette--strict.svg"
    svg2 = r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\public\icons\style-model-mode--vector-art-color-palette--strict (1).svg"
    output_dir = r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\scratch\extracted_svgs"
    
    extract_grid_icons(svg1, output_dir, "sheet1")
    extract_grid_icons(svg2, output_dir, "sheet2")
