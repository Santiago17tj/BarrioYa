import re

def bust_cache(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Increment css cache busters to v=5
    content = re.sub(r'css\?v=\d+', r'css?v=5', content)
    content = re.sub(r'\.css\?v=\d+', r'.css?v=5', content)
    
    # Update theme color
    content = re.sub(r'<meta name="theme-color" content="#00C853">', r'<meta name="theme-color" content="#0F1B2E">', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Busted {filepath}")

bust_cache('index.html')
bust_cache('admin/index.html')
