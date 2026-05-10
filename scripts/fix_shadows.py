import re

def fix_shadows(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace old green rgb with orange rgb
    content = re.sub(r'0,\s*200,\s*83', r'255, 90, 60', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed shadows {filepath}")

fix_shadows('css/styles.css')
