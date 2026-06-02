import re
import os
import xml.etree.ElementTree as ET

def get_path_bbox(d_attr):
    # Find all coordinates in the path d string
    # We can parse the commands and coordinates
    # For a rough estimate of bounding box, just extract all float numbers and pair them as x, y
    tokens = re.findall(r'[-+]?\d*\.\d+|\d+', d_attr)
    coords = [float(t) for t in tokens]
    
    # We need to distinguish between X and Y.
    # In SVG path data, commands are followed by coordinates.
    # Let's do a simple parsing:
    # A path is a sequence of commands (M, L, C, S, Q, T, A, Z, etc.) and numbers.
    # Let's extract all numbers and group them as alternating X, Y if they represent coordinates.
    # Since we just want bounding boxes, let's look at all numbers.
    # Most numbers are x, y coordinates, but some are control points, sweep/large-arc flags (0 or 1), etc.
    # Let's extract all pairs of numbers.
    # We can split the path by letters to get arguments of each command.
    commands = re.findall(r'([a-zA-Z])|([-+]?\d*\.\d+|[-+]?\d+)', d_attr)
    xs = []
    ys = []
    
    # Simple parse:
    current_command = ''
    nums = []
    
    for cmd, val in commands:
        if cmd:
            current_command = cmd
        elif val:
            nums.append(float(val))
            
    # As a simple heuristic, let's just group nums into pairs (x, y) or assume odd/even indices.
    # Since control points also lie in the general vicinity of the path, including all numbers as coordinates
    # will still give an excellent bounding box for clustering!
    # Let's separate into xs and ys by looking at command arguments.
    # Let's do a simpler approach: standard SVG paths alternate x and y for almost all coordinate points.
    # Let's assume alternating: xs is even indices, ys is odd indices.
    # Let's verify if this works.
    if len(nums) >= 2:
        for i in range(0, len(nums) - 1, 2):
            xs.append(nums[i])
            ys.append(nums[i+1])
            
    if not xs or not ys:
        return None
        
    return min(xs), min(ys), max(xs), max(ys)

def cluster_paths(svg_path):
    tree = ET.parse(svg_path)
    root = tree.getroot()
    
    # Find all path elements
    # SVG namespace might be present
    ns = {'svg': 'http://www.w3.org/2000/svg'}
    paths = root.findall('.//svg:path', ns)
    if not paths:
        paths = root.findall('.//path')
        
    print(f"File: {os.path.basename(svg_path)}")
    print(f"Total paths found: {len(paths)}")
    
    path_bboxes = []
    for idx, path in enumerate(paths):
        d = path.get('d')
        if not d:
            continue
        bbox = get_path_bbox(d)
        if bbox:
            path_bboxes.append((idx, path, bbox))
            
    # Now let's cluster the paths by overlap/proximity.
    # Two paths belong to the same cluster if their bounding boxes are close.
    # Let's define "close" as distance between centers or bounding box overlap.
    # Since they are arranged in a grid, let's see their centers.
    clusters = [] # list of lists of (idx, path, bbox)
    
    for item in path_bboxes:
        idx, path, bbox = item
        x1, y1, x2, y2 = bbox
        cx = (x1 + x2) / 2
        cy = (y1 + y2) / 2
        
        # Find if this belongs to an existing cluster
        found = False
        for cluster in clusters:
            # Check distance to cluster center or any item in cluster
            # In a grid of 1024x1024, distinct icons will be separated by at least 100-200 pixels.
            # Let's see if this item is within 120 pixels of any item in the cluster.
            match = False
            for c_item in cluster:
                c_idx, c_path, c_bbox = c_item
                cx1, cy1, cx2, cy2 = c_bbox
                ccx = (cx1 + cx2) / 2
                ccy = (cy1 + cy2) / 2
                dist = ((cx - ccx)**2 + (cy - ccy)**2)**0.5
                if dist < 120:  # 120 pixels threshold
                    match = True
                    break
            if match:
                cluster.append(item)
                found = True
                break
        if not found:
            clusters.append([item])
            
    print(f"Total clusters (icons) found: {len(clusters)}")
    for i, cluster in enumerate(clusters):
        c_xs = []
        c_ys = []
        for idx, path, bbox in cluster:
            x1, y1, x2, y2 = bbox
            c_xs.extend([x1, x2])
            c_ys.extend([y1, y2])
        min_x, max_x = min(c_xs), max(c_xs)
        min_y, max_y = min(c_ys), max(c_ys)
        width = max_x - min_x
        height = max_y - min_y
        print(f"  Cluster {i+1}: Paths count = {len(cluster)}, BBox = [{min_x:.1f}, {min_y:.1f}, {max_x:.1f}, {max_y:.1f}], Size = {width:.1f}x{height:.1f}")
        
    return clusters

if __name__ == '__main__':
    svg1 = r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\public\icons\style-model-mode--vector-art-color-palette--strict.svg"
    svg2 = r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\public\icons\style-model-mode--vector-art-color-palette--strict (1).svg"
    cluster_paths(svg1)
    print("\n" + "="*50 + "\n")
    cluster_paths(svg2)
