"""Test network connectivity."""
import socket
import ssl

HOST = "ep-round-grass-ageqdbrw.c-2.eu-central-1.aws.neon.tech"
PORT = 5432

print(f"Testing connection to {HOST}:{PORT}")

# Test DNS resolution
try:
    ip = socket.gethostbyname(HOST)
    print(f"DNS resolved: {HOST} -> {ip}")
except socket.gaierror as e:
    print(f"DNS resolution failed: {e}")
    exit(1)

# Test TCP connection
try:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(10)
    result = sock.connect_ex((HOST, PORT))
    if result == 0:
        print(f"TCP connection successful to {HOST}:{PORT}")
    else:
        print(f"TCP connection failed with error code: {result}")
    sock.close()
except Exception as e:
    print(f"TCP connection error: {e}")

# Test SSL connection
try:
    context = ssl.create_default_context()
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE

    with socket.create_connection((HOST, PORT), timeout=10) as sock:
        with context.wrap_socket(sock, server_hostname=HOST) as ssock:
            print(f"SSL connection successful! Version: {ssock.version()}")
except Exception as e:
    print(f"SSL connection error: {type(e).__name__}: {e}")
