import time
import uuid
import random
from faker import Faker
import psycopg2
from psycopg2.extras import execute_batch 
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider
from cassandra.concurrent import execute_concurrent_with_args 

pg_conn = psycopg2.connect(
    host="postgres",
    port="5432",
    database="postgres", 
    user="postgres",
    password="123"
)
pg_cursor = pg_conn.cursor()

print("Kết nối Postgre thành công")

cas_cluster = Cluster(['cassandra'], port=9042)
cas_session = cas_cluster.connect("mdm_benchmark") 

print("Kết nối Cassandra thành công")

NUM_RECORDS = 500000 
fake = Faker()
order_ids = [str(uuid.uuid4()) for _ in range(5000)]
driver_ids = [str(uuid.uuid4()) for _ in range(500)]
data_to_insert = []

for _ in range(NUM_RECORDS):
    data_to_insert.append((
        random.choice(order_ids),
        fake.date_time_this_month(),
        random.choice(driver_ids),
        float(fake.latitude()),
        float(fake.longitude())
    ))

print(f"Đã tạo xong {NUM_RECORDS} record. Bắt đầu \n")

start_time = time.time()
query_pg = "INSERT INTO test_location_by_order (order_id, timestamp, driver_id, lat, lng) VALUES (%s, %s, %s, %s, %s)"
print("==Đang chạy benchmark cho PostgreSQL==")
for row in data_to_insert:
    pg_cursor.execute(query_pg, row)

pg_conn.commit()
pg_time = time.time() - start_time
print(f"\nPostgreSQL hoàn thành: {pg_time:.2f} giây\n")

print("==Đang chạy benchmark cho Cassandra==")
start_time = time.time()
query_cas = cas_session.prepare(
    "INSERT INTO bonus_location_by_order (order_id, timestamp, driver_id, lat, lng) VALUES (?, ?, ?, ?, ?)"
)
execute_concurrent_with_args(cas_session, query_cas, data_to_insert, concurrency=100)
cas_time = time.time() - start_time
print(f"\nCassandra hoàn thành: {cas_time:.2f} giây\n")

pg_cursor.close()
pg_conn.close()
cas_cluster.shutdown()