import os
import xml.etree.ElementTree as ET

def dump_first_paths(extracted_dir):
    files = sorted([f for f in os.listdir(extracted_dir) if f.endswith('.svg')])
    for f in files:
        path = os.path.join(extracted_dir, f)
        tree = ET.parse(path)
        root = tree.getroot()
        
        # Find paths
        paths = root.findall('.//path')
        if not paths:
            ns = {'svg': 'http://www.w3.org/2000/svg'}
            paths = root.findall('.//svg:path', ns)
            
        print(f"File: {f} (paths: {len(paths)})")
        if paths:
            d = paths[0].get('d', '')
            fill = paths[0].get('fill', '')
            print(f"  First path: d=\"{d[:100]}...\" fill=\"{fill}\"")

if __name__ == '__main__':
    dump_first_paths(r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\scratch\extracted_svgs")
