import re

def fix_css(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace green rgba shadows
    content = re.sub(r'rgba\(0,\s*200,\s*83,', r'rgba(255, 90, 60,', content)
    
    # In styles.css, replace btn-whatsapp colors with orange
    if "styles.css" in filepath:
        content = re.sub(r'var\(--color-whatsapp\)', r'var(--color-primary-orange)', content)
        content = re.sub(r'var\(--color-whatsapp-dark\)', r'#E04E32', content)
        content = re.sub(r'rgba\(37,\s*211,\s*102,', r'rgba(255, 90, 60,', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {filepath}")

fix_css('css/styles.css')
fix_css('css/cart.css')
fix_css('css/tracking.css')
