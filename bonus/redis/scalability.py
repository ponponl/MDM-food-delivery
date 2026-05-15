import time
import json
import redis
import psycopg2 

DB_CONFIG = {
    'host': '127.0.0.1',
    'port': '5433',
    'dbname': 'postgres',
    'user': 'postgres',
    'password': '123'
}

def test_scalability():
    print("======Khả năng mở rộng thuộc tính=======")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        start = time.time()
        print("Đang chạy lệnh ALTER TABLE để thêm cột 'calories' vào bảng menu_items")
        
        cursor.execute("ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS calories INT DEFAULT NULL")
        conn.commit()
        
        pg_time = time.time() - start
        print(f"PostgreSQL ALTER TABLE tốn: {pg_time:.4f}s")
    
    except Exception as e:
        print(f"Lỗi PostgreSQL: {e}")
    finally:
        if 'conn' in locals() and conn:
            cursor.close()
            conn.close()

    r = redis.Redis(host='127.0.0.1', port=6379, decode_responses=True)
    
    test_id = "res_123"
    original_data = [{"item": "Coffee", "price": 30000}]
    r.set(f"menu:{test_id}", json.dumps(original_data))
    
    start = time.time()
    
    current_data = json.loads(r.get(f"menu:{test_id}"))
    current_data[0]["calories"] = 120 
    
    r.set(f"menu:{test_id}", json.dumps(current_data))
    
    redis_time = time.time() - start
    print(f"\nRedis thêm thuộc tính 'calories' tốn: {redis_time:.4f}s\n")

if __name__ == "__main__":
    test_scalability()