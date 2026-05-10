import psycopg2
import sys

# Replace with the user's password
DB_URL = "postgresql://postgres:santiago1701luis.@db.gxpyfvzwienmswstrfld.supabase.co:5432/postgres"

print("Conectando a Supabase...")
try:
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    print("¡Conexión exitosa!")
    
    with open('database_setup.sql', 'r', encoding='utf-8') as f:
        sql = f.read()
        
    print("Ejecutando script SQL...")
    cursor.execute(sql)
    print("¡Base de datos inicializada correctamente! 🎉")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
