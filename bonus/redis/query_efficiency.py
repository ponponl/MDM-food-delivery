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

def test_complex_query(iterations=500):
    print("=======ĐO ĐỘ TRỄ TRUY VẤN=======")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        r = redis.Redis(host='127.0.0.1', port=6379, decode_responses=True)
        
        complex_sql = """
            SELECT r.name, m.item_name, m.price 
            FROM restaurants r
            JOIN menu_items m ON r.id = m.restaurant_id
            WHERE m.item_name ILIKE '%a%' 
              AND m.price BETWEEN 20000 AND 80000
            ORDER BY m.price DESC
            LIMIT 50;
        """
        
        print(f"\n1. Đang test PostgreSQL với {iterations} lượt truy vấn")
        start = time.time()
        for _ in range(iterations):
            cursor.execute(complex_sql)
            pg_result = cursor.fetchall()
        pg_time = time.time() - start
        
        pg_latency = (pg_time / iterations) * 1000
        print(f"\n[PostgreSQL] Độ trễ trung bình: {pg_latency:.4f} ms/query")

        print("\n2. Đang tính toán sẵn và nạp kết quả lên Redis")
        cache_key = "query:search:keyword_a:20k_80k"
        
        if pg_result:
            cache_data = [{"restaurant": row[0], "item": row[1], "price": row[2]} for row in pg_result]
        else:
            cache_data = [] 
            print("Cảnh báo: PostgreSQL trả về rỗng (Faker không tạo ra data khớp điều kiện)")
            
        r.setex(cache_key, 300, json.dumps(cache_data))
        
        print(f"Đang test Redis Cache với {iterations} lượt truy vấn")
        start = time.time()
        for _ in range(iterations):
            r.get(cache_key)
        redis_time = time.time() - start
        
        redis_latency = (redis_time / iterations) * 1000
        print(f"\n [Redis] Độ trễ trung bình: {redis_latency:.4f} ms/query\n")

    except Exception as e:
        print(f"Lỗi: {e}")
    finally:
        if 'conn' in locals() and conn:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    test_complex_query(500)