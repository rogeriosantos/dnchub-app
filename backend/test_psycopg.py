"""Test with psycopg (sync)."""
import psycopg2

HOST = "ep-round-grass-ageqdbrw-pooler.c-2.eu-central-1.aws.neon.tech"
PORT = 5432
USER = "neondb_owner"
PASSWORD = "npg_IGMlN7CvuT8d"
DATABASE = "neondb"

print(f"Testing psycopg2 connection to {HOST}...")

try:
    conn = psycopg2.connect(
        host=HOST,
        port=PORT,
        user=USER,
        password=PASSWORD,
        database=DATABASE,
        sslmode="require",
        connect_timeout=30,
    )
    print("Connected successfully!")

    cur = conn.cursor()
    cur.execute("SELECT 1")
    result = cur.fetchone()
    print(f"Query result: {result}")

    cur.close()
    conn.close()
    print("Connection closed.")

except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
