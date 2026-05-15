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

def test_consistency():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        r = redis.Redis(host='127.0.0.1', port=6379, decode_responses=True)
        r.flushall()

        rid = "res_123"
        r_name = "Quán Cafe"
        
        cursor.execute("DELETE FROM restaurants WHERE id = %s", (rid,))
        
        cursor.execute("INSERT INTO restaurants (id, name) VALUES (%s, %s)", (rid, r_name))
        cursor.execute(
            "INSERT INTO menu_items (restaurant_id, item_name, price) VALUES (%s, %s, %s)", 
            (rid, "Coffee", 30000)
        )
        conn.commit()
        
        menu_cache = [{"item": "Coffee", "price": 30000}]
        r.setex(f"menu:{rid}", 300, json.dumps(menu_cache))
        print(f"Giá ban đầu thiết lập trong PostgreSQL và Redis: 30000")

        print("\n[Hành động] Chủ quán thay đổi giá ly Coffee")
        cursor.execute(
            "UPDATE menu_items SET price = 35000 WHERE restaurant_id = %s AND item_name = 'Coffee'", 
            (rid,)
        )
        conn.commit()
        print("-> Đã cập nhật giá mới trong PostgreSQL thành: 35000")

        cursor.execute("SELECT price FROM menu_items WHERE restaurant_id = %s AND item_name = 'Coffee'", (rid,))
        pg_val = cursor.fetchone()[0]
        
        redis_val = json.loads(r.get(f"menu:{rid}"))[0]['price']

        print(f"\n========KẾT QUẢ HIỂN THỊ CHO KHÁCH HÀNG==========")
        print(f"Truy vấn vào PostgreSQL: Giá trả về là {pg_val}")
        print(f"Truy vấn vào Redis Cache: Giá trả về là {redis_val}\n")
        
    except Exception as e:
        print(f"Lỗi: {e}")
    finally:
        if 'conn' in locals() and conn:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    test_consistency()