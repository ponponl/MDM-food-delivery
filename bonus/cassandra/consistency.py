import time
import uuid
import psycopg2
from cassandra.cluster import Cluster
from cassandra.query import SimpleStatement
from cassandra import ConsistencyLevel

pg_conn_A = psycopg2.connect(host="127.0.0.1", port="5433", database="postgres", user="postgres", password="123")
pg_cursor_A = pg_conn_A.cursor()

pg_conn_B = psycopg2.connect(host="127.0.0.1", port="5433", database="postgres", user="postgres", password="123")
pg_cursor_B = pg_conn_B.cursor()

cas_cluster = Cluster(['127.0.0.1'], port=9042)
cas_session = cas_cluster.connect("mdm_benchmark")

print("=========CONSISTENCY=========")

test_order_id = str(uuid.uuid4())
driver_id = str(uuid.uuid4())

print("\n1. POSTGRESQL")
try:
    pg_conn_A.autocommit = False
    pg_cursor_A.execute("BEGIN;") 
    
    pg_cursor_A.execute(
        "INSERT INTO test_location_by_order (order_id, timestamp, driver_id, lat, lng) VALUES (%s, NOW(), %s, 10.0, 106.0)",
        (test_order_id, driver_id)
    )
    
    pg_cursor_A.execute("SELECT lat, lng FROM test_location_by_order WHERE order_id = %s", (test_order_id,))
    print(f"[User A - Shipper] Đọc thử trước khi Commit: Thấy tọa độ {pg_cursor_A.fetchone()}")
    
    pg_cursor_B.execute("SELECT lat, lng FROM test_location_by_order WHERE order_id = %s", (test_order_id,))
    print(f"[User B - Khách]   Cố gắng đọc tọa độ: Thấy {pg_cursor_B.fetchone()}")

    print("\n----- Bỗng nhiên User A rớt mạng ----")
    raise Exception("LỖI MẠNG ĐỘT NGỘT!") 
    
    pg_conn_A.commit() 
except Exception as e:
    pg_conn_A.rollback() 
    print("HỆ THỐNG ĐÃ ROLLBACK. Hủy bỏ hoàn toàn dữ liệu đang ghi dở của User A.")

pg_cursor_B.execute("SELECT lat, lng FROM test_location_by_order WHERE order_id = %s", (test_order_id,))
print(f"[User B - Khách]   Đọc lại sau sự cố crash: Thấy {pg_cursor_B.fetchone()}")

print("\n2. CASSANDRA")

print("\n--- Chế độ ONE ---")
insert_one = SimpleStatement(
    "INSERT INTO bonus_location_by_order (order_id, timestamp, driver_id, lat, lng) VALUES (%s, toTimestamp(now()), %s, 10.0, 106.0)",
    consistency_level=ConsistencyLevel.ONE
)
select_one = SimpleStatement(
    "SELECT lat, lng FROM bonus_location_by_order WHERE order_id = %s",
    consistency_level=ConsistencyLevel.ONE 
)

start_one = time.time()
cas_session.execute(insert_one, (test_order_id, driver_id)) 
res_one = cas_session.execute(select_one, (test_order_id,)).one() 
time_one = time.time() - start_one

print(f"Đã ghi và đọc lại được tọa độ: {res_one}")
print(f"Thời gian xử lý chuỗi: {time_one:.4f} giây.")

print("\n--- Chế độ ALL ---")
insert_all = SimpleStatement(
    "INSERT INTO bonus_location_by_order (order_id, timestamp, driver_id, lat, lng) VALUES (%s, toTimestamp(now()), %s, 10.5, 106.5)",
    consistency_level=ConsistencyLevel.ALL
)
select_all = SimpleStatement(
    "SELECT lat, lng FROM bonus_location_by_order WHERE order_id = %s",
    consistency_level=ConsistencyLevel.ALL 
)

start_all = time.time()
cas_session.execute(insert_all, (test_order_id, driver_id)) 
res_all = cas_session.execute(select_all, (test_order_id,)).one() 
time_all = time.time() - start_all

print(f"Đã ghi và đọc lại được tọa độ mới: {res_all}")
print(f"Thời gian xử lý chuỗi: {time_all:.4f} giây\n")

pg_conn_A.autocommit = True
pg_cursor_A.execute("DELETE FROM test_location_by_order WHERE order_id = %s", (test_order_id,))
cas_session.execute("DELETE FROM bonus_location_by_order WHERE order_id = %s", (test_order_id,))

pg_cursor_A.close()
pg_conn_A.close()
pg_cursor_B.close()
pg_conn_B.close()
cas_cluster.shutdown()