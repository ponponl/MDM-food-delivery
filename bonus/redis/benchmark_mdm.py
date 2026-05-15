import random
import psycopg2
import redis  
from faker import Faker

fake = Faker()

DB_CONFIG = {
    'host': 'postgres',
    'port': '5432',
    'dbname': 'postgres',
    'user': 'postgres',
    'password': '123'
}

def clean_database_and_cache(cursor):
    print("Đang dọn dẹp dữ liệu cũ")
    
    cursor.execute("DROP TABLE IF EXISTS menu_items CASCADE")
    cursor.execute("DROP TABLE IF EXISTS restaurants CASCADE")
    
    cursor.execute("""
        CREATE TABLE restaurants (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(255)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE menu_items (
            id SERIAL PRIMARY KEY,
            restaurant_id VARCHAR(50) REFERENCES restaurants(id) ON DELETE CASCADE,
            item_name VARCHAR(255),
            price INT
        )
    """)
    print("Đã reset xong 2 bảng restaurants và menu_items trong PostgreSQL")

    try:
        r = redis.Redis(host='redis', port=6379, decode_responses=True)
        r.flushall()
        print("Đã xóa sạch toàn bộ Cache trong Redis!")
    except Exception as e:
        print(f"Không thể kết nối để xóa Redis: {e}")

def insert_dummy_data(num=1000):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        clean_database_and_cache(cursor)
        
        print(f"\nĐang phát sinh và chèn {num} record nhà hàng vào PostgreSQL")
        for _ in range(num):
            r_id = fake.uuid4()
            r_name = fake.company()
            
            cursor.execute("INSERT INTO restaurants (id, name) VALUES (%s, %s)", (r_id, r_name))
            
            for _ in range(10):
                item_name = fake.word()
                price = random.randint(20000, 100000)
                cursor.execute(
                    "INSERT INTO menu_items (restaurant_id, item_name, price) VALUES (%s, %s, %s)", 
                    (r_id, item_name, price)
                )
        
        conn.commit()
        print("Chèn dữ liệu quan hệ hoàn tất")
        
    except Exception as e:
        print(f"Lỗi: {e}")
    finally:
        if 'conn' in locals() and conn: 
            cursor.close()
            conn.close()

if __name__ == "__main__":
    insert_dummy_data(10000)