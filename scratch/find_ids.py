import xml.etree.ElementTree as ET

def find_ids_and_classes(svg_path):
    tree = ET.parse(svg_path)
    root = tree.getroot()
    
    print(f"File: {svg_path}")
    print("Listing all elements with id, class, or name attributes:")
    
    count = 0
    for elem in root.iter():
        id_val = elem.get('id')
        class_val = elem.get('class')
        name_val = elem.get('name')
        if id_val or class_val or name_val:
            print(f"Tag: {elem.tag}, id: {id_val}, class: {class_val}, name: {name_val}")
            count += 1
            if count > 50:
                print("Truncating listing after 50 elements.")
                break
    if count == 0:
        print("No elements with id, class, or name found.")

if __name__ == '__main__':
    svg1 = r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\public\icons\style-model-mode--vector-art-color-palette--strict.svg"
    svg2 = r"c:\Users\bradr\OneDrive\Documents\GitHub\events-system\public\icons\style-model-mode--vector-art-color-palette--strict (1).svg"
    find_ids_and_classes(svg1)
    print("\n" + "="*50 + "\n")
    find_ids_and_classes(svg2)
