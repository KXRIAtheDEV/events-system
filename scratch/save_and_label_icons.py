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

def slice_sheet(svg_path, mapping, style_prefix=""):
    tree = ET.parse(svg_path)
    root = tree.getroot()
    
    ns = {'svg': 'http://www.w3.org/2000/svg'}
    paths = root.findall('.//svg:path', ns)
    if not paths:
        paths = root.findall('.//path')
        
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
        
        col = int(cx // 256)
        row = int(cy // 256)
        
        col = max(0, min(3, col))
        row = max(0, min(3, row))
        
        grid[(row, col)].append((path, bbox))
        
    extracted_icons = {}
    
    for (r, c), items in grid.items():
        if not items:
            continue
            
        # Get target name from mapping
        name = mapping.get((r, c))
        if not name:
            name = f"r{r}_c{c}"
            
        filename = f"{style_prefix}{name}.svg"
        
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
        
        padding = 10
        min_x_pad = max(0.0, min_x - padding)
        min_y_pad = max(0.0, min_y - padding)
        max_x_pad = min(1024.0, max_x + padding)
        max_y_pad = min(1024.0, max_y + padding)
        view_w = max_x_pad - min_x_pad
        view_h = max_y_pad - min_y_pad
        
        new_root = ET.Element('svg', {
            'xmlns': 'http://www.w3.org/2000/svg',
            'viewBox': f"{min_x_pad:.1f} {min_y_pad:.1f} {view_w:.1f} {view_h:.1f}",
            'width': '512',
            'height': '512'
        })
        
        for path, bbox in items:
            new_path = ET.SubElement(new_root, 'path')
            for k, v in path.items():
                new_path.set(k, v)
                
        extracted_icons[filename] = new_root
        
    return extracted_icons

def save_and_label():
    svg1 = r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\public\icons\style-model-mode--vector-art-color-palette--strict.svg"
    # style-model-mode--vector-art-color-palette--strict (1).svg is the primary glassmorphism set (Sheet 2)
    svg2 = r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\public\icons\style-model-mode--vector-art-color-palette--strict (1).svg"
    
    # 4x4 Grid Mapping
    mapping = {
        (0, 0): "calendar",
        (0, 1): "ticket",
        (0, 2): "revenue",
        (0, 3): "attendees",
        (1, 0): "home",
        (1, 1): "analytics",
        (1, 2): "bookings",
        (1, 3): "payouts",
        (2, 0): "promotion",
        (2, 1): "settings",
        (2, 2): "support",
        (2, 3): "mail",
        (3, 0): "reviews",
        (3, 1): "logout",
        (3, 2): "login",
        (3, 3): "notifications"
    }
    
    # Slice both sheets
    print("Slicing Sheet 2 (Glassmorphism, Primary)...")
    sheet2_icons = slice_sheet(svg2, mapping, style_prefix="")
    
    print("Slicing Sheet 1 (Orange-Red, Style 1)...")
    sheet1_icons = slice_sheet(svg1, mapping, style_prefix="style1_")
    
    # Directories to save to
    dest_dirs = [
        r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\public\icons",
        r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\frontend\static\icons"
    ]
    
    for d in dest_dirs:
        os.makedirs(d, exist_ok=True)
        
    all_icons = {**sheet1_icons, **sheet2_icons}
    
    # Save all sliced icons
    for filename, tree_root in all_icons.items():
        for d in dest_dirs:
            out_path = os.path.join(d, filename)
            tree = ET.ElementTree(tree_root)
            tree.write(out_path, encoding='utf-8', xml_declaration=True)
            print(f"Saved {filename} to {out_path}")
            
    # Save aliases (revenue-1k, analytics-ring, location)
    aliases = {
        "revenue-1k.svg": "revenue.svg",
        "analytics-ring.svg": "analytics.svg",
        "location.svg": "attendees.svg",
        "style1_revenue-1k.svg": "style1_revenue.svg",
        "style1_analytics-ring.svg": "style1_analytics.svg",
        "style1_location.svg": "style1_attendees.svg"
    }
    
    for alias_name, target_name in aliases.items():
        for d in dest_dirs:
            target_path = os.path.join(d, target_name)
            alias_path = os.path.join(d, alias_name)
            if os.path.exists(target_path):
                # Copy or write
                with open(target_path, 'r', encoding='utf-8') as f_in:
                    content = f_in.read()
                with open(alias_path, 'w', encoding='utf-8') as f_out:
                    f_out.write(content)
                print(f"Created alias {alias_name} -> {target_name} in {d}")

if __name__ == '__main__':
    save_and_label()
