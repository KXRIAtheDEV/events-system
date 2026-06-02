import os
import re
import xml.etree.ElementTree as ET

def get_path_d_list(svg_path):
    tree = ET.parse(svg_path)
    root = tree.getroot()
    
    paths = root.findall('.//path')
    if not paths:
        ns = {'svg': 'http://www.w3.org/2000/svg'}
        paths = root.findall('.//svg:path', ns)
        
    d_list = []
    for p in paths:
        d = p.get('d', '')
        if d:
            # Clean whitespaces and normalize numbers for comparison
            d_clean = re.sub(r'\s+', '', d).strip()
            d_list.append(d_clean)
    return d_list

def compare_individual_with_extracted(individual_dir, extracted_dir):
    ind_files = [f for f in os.listdir(individual_dir) if f.endswith('.svg')]
    ext_files = [f for f in os.listdir(extracted_dir) if f.endswith('.svg')]
    
    print(f"Comparing {len(ind_files)} individual icons with {len(ext_files)} extracted cells:\n")
    
    ind_data = {}
    for f in ind_files:
        path = os.path.join(individual_dir, f)
        ind_data[f] = get_path_d_list(path)
        
    ext_data = {}
    for f in ext_files:
        path = os.path.join(extracted_dir, f)
        ext_data[f] = get_path_d_list(path)
        
    for ind_f, ind_paths in ind_data.items():
        if not ind_paths:
            print(f"Individual {ind_f} has no paths.")
            continue
            
        print(f"Individual {ind_f}: {len(ind_paths)} paths")
        found_matches = []
        for ext_f, ext_paths in ext_data.items():
            if not ext_paths:
                continue
                
            # Check how many paths match
            matching_paths = 0
            for ip in ind_paths:
                for ep in ext_paths:
                    # Check if one path is a substring of another or they are very similar
                    if ip == ep or ip in ep or ep in ip:
                        matching_paths += 1
                        break
            if matching_paths > 0:
                pct = (matching_paths / len(ind_paths)) * 100
                found_matches.append((ext_f, matching_paths, len(ext_paths), pct))
                
        # Sort matches by percentage matching
        found_matches.sort(key=lambda x: x[3], reverse=True)
        for ext_f, matches, total, pct in found_matches[:3]:
            print(f"  -> Matches {ext_f}: {matches}/{len(ind_paths)} paths matched ({pct:.1f}%), Cell has {total} paths.")
            
if __name__ == '__main__':
    individual_dir = r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\public\icons\individual"
    extracted_dir = r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\scratch\extracted_svgs"
    compare_individual_with_extracted(individual_dir, extracted_dir)
