import sqlite3
conn = sqlite3.connect('cafeteria.db')
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]
print("Tablas:", tables)
if tables:
    # Buscar tabla de usuarios
    user_table = next((t for t in tables if 'user' in t.lower() or 'usuario' in t.lower() or 'empleado' in t.lower()), None)
    if user_table:
        cur.execute(f"SELECT * FROM {user_table} LIMIT 5")
        cols = [d[0] for d in cur.description]
        rows = cur.fetchall()
        print(f"\nColumnas de {user_table}:", cols)
        for r in rows:
            print(dict(zip(cols, r)))
conn.close()
