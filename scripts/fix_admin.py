import re

def fix_css(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Admin charts
    content = re.sub(r'#00C853', r'#FF5A3C', content) # Orange charts
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {filepath}")

fix_css('admin/admin.js')
