"""Test database connection."""
import asyncio
import ssl

import asyncpg


async def test_connection():
    """Test direct asyncpg connection to Neon."""
    print("Testing connection to Neon...")

    # Create SSL context
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    try:
        print("Attempting to connect (timeout: 30s)...")
        # Try pooler endpoint
        conn = await asyncio.wait_for(
            asyncpg.connect(
                host="ep-round-grass-ageqdbrw-pooler.c-2.eu-central-1.aws.neon.tech",
                port=5432,
                user="neondb_owner",
                password="npg_IGMlN7CvuT8d",
                database="neondb",
                ssl=ssl_context,
            ),
            timeout=30
        )
        print("Connected successfully!")

        # Test query
        result = await conn.fetchval("SELECT 1")
        print(f"Query result: {result}")

        await conn.close()
        print("Connection closed.")

    except asyncio.TimeoutError:
        print("ERROR: Connection timed out after 30 seconds")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")


if __name__ == "__main__":
    asyncio.run(test_connection())
