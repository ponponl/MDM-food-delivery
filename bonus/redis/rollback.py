import json
import redis
import psycopg2

# Cấu hình kết nối PostgreSQL
DB_CONFIG = {
    'host': '127.0.0.1',
    'port': '5433',
    'dbname': 'postgres',
    'user': 'postgres',
    'password': '123'
}

def rollback_changes():
    print("--- Hoàn tác PostgreSQL ---")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("Đang chạy lệnh xóa cột 'calories' khỏi bảng menu_items...")
        cursor.execute("ALTER TABLE menu_items DROP COLUMN IF EXISTS calories")
        conn.commit()
        print("✅ Đã xóa cột thành công!")
        
    except Exception as e:
        print(f"Lỗi PostgreSQL: {e}")
    finally:
        if 'conn' in locals() and conn:
            cursor.close()
            conn.close()

    print("\n--- Hoàn tác Redis ---")
    try:
        r = redis.Redis(host='127.0.0.1', port=6379, decode_responses=True)
        test_id = "res_123"
        
        cached_data = r.get(f"menu:{test_id}")
        if cached_data:
            current_data = json.loads(cached_data)
            
            if len(current_data) > 0 and "calories" in current_data[0]:
                del current_data[0]["calories"]
                r.set(f"menu:{test_id}", json.dumps(current_data))
                print("Đã khôi phục chuỗi JSON trong Redis về trạng thái cũ!")
            else:
                print("Thuộc tính 'calories' không tồn tại trong JSON.")
        else:
            print("Key không tồn tại hoặc đã hết hạn (hết TTL).")
            
    except Exception as e:
        print(f"Lỗi Redis: {e}")

if __name__ == "__main__":
    rollback_changes()