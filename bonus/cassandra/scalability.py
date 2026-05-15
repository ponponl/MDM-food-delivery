import time
import psycopg2
from cassandra.cluster import Cluster

pg_conn = psycopg2.connect(host="127.0.0.1", port="5433", database="postgres", user="postgres", password="123")
pg_conn.autocommit = True 
pg_cursor = pg_conn.cursor()

# Cassandra
cas_cluster = Cluster(['127.0.0.1'], port=9042)
cas_session = cas_cluster.connect("mdm_benchmark")

print(f"Đo Scalability trên 500.000 records\n")

start_pg = time.time()
try:
    pg_cursor.execute("ALTER TABLE test_location_by_order ADD COLUMN status_new TEXT DEFAULT 'active'")
    pg_time = time.time() - start_pg
    print(f"PostgreSQL ALTER TABLE: {pg_time:.4f} giây\n")
except Exception as e:
    print(f"PostgreSQL lỗi: {e}")
    pg_time = 0

start_cas = time.time()
try:
    cas_session.execute("ALTER TABLE bonus_location_by_order ADD status_new text")
    cas_time = time.time() - start_cas
    print(f"Cassandra ALTER TABLE: {cas_time:.4f} giây\n")
except Exception as e:
    print(f"Cassandra lỗi: Có thể cột đã tồn tại. {e}")
    cas_time = 0

try:
    pg_cursor.execute("ALTER TABLE test_location_by_order DROP COLUMN status_new")
except Exception as e:
    print(f"PostgreSQL Rollback thất bại: {e}")

try:
    cas_session.execute("ALTER TABLE bonus_location_by_order DROP status_new")
except Exception as e:
    print(f"Cassandra Rollback thất bại: {e}")

# Đóng kết nối
pg_cursor.close()
pg_conn.close()
cas_cluster.shutdown()