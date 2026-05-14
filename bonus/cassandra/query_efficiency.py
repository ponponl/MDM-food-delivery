import time
import uuid
import random
from faker import Faker
import psycopg2
from psycopg2.extras import execute_batch 
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider
from cassandra.concurrent import execute_concurrent_with_args 
import time
import random

pg_conn = psycopg2.connect(
    host="127.0.0.1",
    port="5433",
    database="postgres", 
    user="postgres",
    password="123"
)
pg_cursor = pg_conn.cursor()

print("Kết nối Postgre thành công")

cas_cluster = Cluster(['127.0.0.1'], port=9042)
cas_session = cas_cluster.connect("mdm_benchmark") 

print("Kết nối Cassandra thành công")
pg_cursor.execute("SELECT order_id FROM test_location_by_order LIMIT 5000")
rows = pg_cursor.fetchall()
if not rows:
    print("Lỗi: Database trống")
    exit()
    
order_ids = [row[0] for row in rows]
read_args = [(oid,) for oid in order_ids]


print(f"\n======Bắt đầu======\n")
# 1. POSTGRESQL
start_read_pg = time.time()
query_pg_read = "SELECT * FROM test_location_by_order WHERE order_id = %s ORDER BY timestamp DESC LIMIT 1"

for oid in read_args: 
    pg_cursor.execute(query_pg_read, oid)
    pg_cursor.fetchone() 

pg_read_time = time.time() - start_read_pg
print(f"\nPostgreSQL: {pg_read_time:.4f} giây\n")

start_read_cas = time.time()
query_cas_read = cas_session.prepare("SELECT * FROM bonus_location_by_order WHERE order_id = ? LIMIT 1")

execute_concurrent_with_args(cas_session, query_cas_read, read_args, concurrency=100)

cas_read_time = time.time() - start_read_cas
print(f"Cassandra: {cas_read_time:.4f} giây\n")

pg_cursor.close()
pg_conn.close()
cas_cluster.shutdown()