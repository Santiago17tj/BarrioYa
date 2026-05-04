import re

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Favicon replacements
    content = re.sub(r'href="([^"]*)BarrioYalogo\.png"', r'href="assets/favicon-barrioya.png"', content)
    content = re.sub(r'href="\.\./BarrioYalogo\.png"', r'href="../assets/favicon-barrioya.png"', content)

    # Navbar/Sidebar logo replacements
    content = re.sub(r'src="([^"]*)BarrioYalogo\.png" alt="BarrioYa Logo"', r'src="assets/logo-barrioya-horizontal.svg" alt="BarrioYa Logo"', content)
    content = re.sub(r'src="\.\./BarrioYalogo\.png" alt="BarrioYa"', r'src="../assets/logo-barrioya-horizontal.svg" alt="BarrioYa"', content)
    content = re.sub(r'<img src="BarrioYalogo.png" alt="BarrioYa Logo" class="navbar-logo">', r'<img src="assets/logo-barrioya-horizontal.svg" alt="BarrioYa Logo" class="navbar-logo" style="max-height: 40px; width: auto;">', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")

replace_in_file('index.html')
replace_in_file('admin/index.html')
