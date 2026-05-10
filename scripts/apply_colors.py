import os
import re
import shutil

def update_file(filepath, replacements):
    """
    Actualiza un archivo aplicando reemplazos de regex. 
    Crea un backup .bak antes de modificar.
    """
    if not os.path.exists(filepath):
        print(f"⚠️ Archivo no encontrado: {filepath}")
        return

    # Crear backup
    shutil.copy2(filepath, filepath + '.bak')
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for old, new in replacements.items():
            content = re.sub(old, new, content)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"SUCCESS: Updated {filepath} (Backup created)")
    except Exception as e:
        print(f"ERROR processing {filepath}: {e}")
        # Restaurar desde backup si falla
        shutil.copy2(filepath + '.bak', filepath)
        print(f"ROLLBACK: File restored from backup.")

# styles.css replacements
styles_replacements = {
    # Typography & Backgrounds
    r'var\(--color-text\)': 'var(--color-text-dark)',
    r'var\(--color-text-secondary\)': 'var(--color-text-muted)',
    r'var\(--color-bg\)': 'var(--color-bg-light)',
    r'var\(--color-bg-alt\)': 'var(--color-bg-white)',
    # Primary CTA buttons
    r'var\(--color-primary\)': 'var(--color-primary-orange)',
    r'var\(--color-primary-dark\)': '#E04E32', # Darker orange for hover
    r'var\(--color-primary-light\)': '#FFEDEA', # Lighter orange
    r'var\(--color-primary-lighter\)': '#FFD1C9',
    # Accent
    r'var\(--color-accent\)': 'var(--color-accent-yellow)',
    r'var\(--color-accent-hover\)': '#E5A140',
    # Specific component overwrites
    r'\.service-card \{([^}]*)background: var\(--color-white\);': r'.service-card {\1background: var(--color-bg-white);',
    # Dark mode
    r'@media \(prefers-color-scheme: dark\) \{([^}]+)\}': r'@media (prefers-color-scheme: dark) {\1}' # Need careful dark mode replace
}

# Apply to styles.css
update_file('css/styles.css', styles_replacements)

# Apply to cart.css
cart_replacements = {
    r'var\(--color-text\)': 'var(--color-text-dark)',
    r'var\(--color-text-secondary\)': 'var(--color-text-muted)',
    r'var\(--color-bg\)': 'var(--color-bg-light)',
    r'var\(--color-white\)': 'var(--color-bg-white)',
    r'var\(--color-primary\)': 'var(--color-primary-orange)',
    r'var\(--color-primary-dark\)': '#E04E32',
    r'var\(--color-accent\)': 'var(--color-accent-yellow)'
}
update_file('css/cart.css', cart_replacements)

# Apply to tracking.css
tracking_replacements = {
    r'var\(--color-text\)': 'var(--color-text-dark)',
    r'var\(--color-text-secondary\)': 'var(--color-text-muted)',
    r'var\(--color-bg\)': 'var(--color-bg-light)',
    r'var\(--color-white\)': 'var(--color-bg-white)',
    r'var\(--color-primary\)': 'var(--color-secondary-green)', # Success states usually green
    r'var\(--color-primary-dark\)': '#1C9681'
}
update_file('css/tracking.css', tracking_replacements)

# Apply to admin.css
admin_replacements = {
    r'--admin-bg:\s*#[0-9A-Fa-f]+;': '--admin-bg: #F8FAFC;', # Modo Claro
    r'--admin-surface:\s*#[0-9A-Fa-f]+;': '--admin-surface: #FFFFFF;',
    r'--admin-text:\s*#[0-9A-Fa-f]+;': '--admin-text: #0F172A;',
    r'--admin-border:\s*#[0-9A-Fa-f]+;': '--admin-border: #E2E8F0;',
    r'--admin-primary:\s*#[0-9A-Fa-f]+;': '--admin-primary: #FF5A3C;',
}
update_file('admin/admin.css', admin_replacements)
