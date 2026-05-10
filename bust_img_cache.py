import re

def bust_img(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Append cache buster to hero-mockup.png
    content = re.sub(r'assets/images/hero-mockup\.png(?:\?v=\d+)?', r'assets/images/hero-mockup.png?v=3', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

bust_img('index.html')
