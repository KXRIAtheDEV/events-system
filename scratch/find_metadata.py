import xml.etree.ElementTree as ET

def find_titles_and_metadata(svg_path):
    tree = ET.parse(svg_path)
    root = tree.getroot()
    
    print(f"File: {svg_path}")
    
    # Search for title, desc, text
    ns = {'svg': 'http://www.w3.org/2000/svg'}
    
    titles = root.findall('.//svg:title', ns) + root.findall('.//title')
    descs = root.findall('.//svg:desc', ns) + root.findall('.//desc')
    texts = root.findall('.//svg:text', ns) + root.findall('.//text')
    metadata = root.findall('.//svg:metadata', ns) + root.findall('.//metadata')
    
    print(f"  Titles: {len(titles)}")
    for t in titles:
        print(f"    Text: {t.text}")
        
    print(f"  Descs: {len(descs)}")
    for d in descs:
        print(f"    Text: {d.text}")
        
    print(f"  Texts: {len(texts)}")
    for txt in texts:
        print(f"    Text: {txt.text}")
        
    print(f"  Metadata: {len(metadata)}")
    for m in metadata:
        print(f"    Content: {ET.tostring(m, encoding='utf-8').decode('utf-8')[:300]}")

if __name__ == '__main__':
    svg1 = r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\public\icons\style-model-mode--vector-art-color-palette--strict.svg"
    svg2 = r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\public\icons\style-model-mode--vector-art-color-palette--strict (1).svg"
    find_titles_and_metadata(svg1)
    print("\n" + "="*50 + "\n")
    find_titles_and_metadata(svg2)
