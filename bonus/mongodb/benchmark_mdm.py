import time
import uuid
import random
from faker import Faker
from pymongo import MongoClient
from cassandra.cluster import Cluster
from cassandra.concurrent import execute_concurrent_with_args

mongo_client = MongoClient("mongodb://mongodb:27017/")
mongo_db = mongo_client["mdm_benchmark"]
mongo_collection = mongo_db["menu_items"]

cas_cluster = Cluster(['cassandra'], port=9042)
cas_session = cas_cluster.connect() 

print("Đang khởi tạo lại Schema cho cả MongoDB và Cassandra")

mongo_collection.drop() 

cas_session.execute("""
    CREATE KEYSPACE IF NOT EXISTS mdm_benchmark 
    WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
""")
cas_session.set_keyspace('mdm_benchmark')

cas_session.execute("DROP TABLE IF EXISTS menu_items")
cas_session.execute("DROP TABLE IF EXISTS item_toppings")
cas_session.execute("DROP TABLE IF EXISTS menu_items_v2")
cas_session.execute("DROP TYPE IF EXISTS topping_type")

cas_session.execute("""
    CREATE TYPE topping_type (
        name text,
        extra_price double,
        is_available boolean
    )
""")

cas_session.execute("""
    CREATE TABLE menu_items (
        id text PRIMARY KEY,
        restaurant_id text,
        name text,
        price double,
        category text
    )
""")
cas_session.execute("""
    CREATE TABLE item_toppings (
        item_id text,
        topping_name text,
        extra_price double,
        is_available boolean,
        PRIMARY KEY (item_id, topping_name)
    )
""")

cas_session.execute("""
    CREATE TABLE menu_items_v2 (
        id text PRIMARY KEY,
        restaurant_id text,
        name text,
        price double,
        category text,
        toppings list<frozen<topping_type>>
    )
""")

class ToppingType(object):
    def __init__(self, name, extra_price, is_available):
        self.name = name
        self.extra_price = extra_price
        self.is_available = is_available

cas_cluster.register_user_type('mdm_benchmark', 'topping_type', ToppingType)

print("Kết nối và khởi tạo Schema thành công")

NUM_ITEMS = 50000 
fake = Faker()

mongo_data = []
cas_v1_items = []
cas_v1_toppings = []
cas_v2_items = []

topping_pool = ["Trân châu đen", "Trân châu trắng", "Thạch đào", "Phô mai", "Kem macchiato", "Pudding trứng", "Xúc xích"]

print(f"Đang sinh dữ liệu cho {NUM_ITEMS} món ăn")

for _ in range(NUM_ITEMS):
    item_id = str(uuid.uuid4())
    rest_id = str(uuid.uuid4())
    item_name = fake.word().capitalize() + " " + random.choice(["Size M", "Size L", "Đặc biệt"])
    price = round(random.uniform(30000, 150000), 0)
    category = "Drink"
    
    mongo_toppings = []
    cas_v2_toppings_list = [] 
    
    num_toppings = random.randint(3, 5)
    selected_toppings = random.sample(topping_pool, num_toppings)
    
    for t_name in selected_toppings:
        t_price = float(random.choice([5000, 10000, 15000]))
        t_available = True
        
        mongo_toppings.append({"name": t_name, "extra_price": t_price, "is_available": t_available})
        cas_v1_toppings.append((item_id, t_name, t_price, t_available))
        cas_v2_toppings_list.append(ToppingType(t_name, t_price, t_available))
        
    mongo_data.append({"_id": item_id, "restaurant_id": rest_id, "name": item_name, "price": price, "category": category, "toppings": mongo_toppings})
    cas_v1_items.append((item_id, rest_id, item_name, price, category))
    cas_v2_items.append((item_id, rest_id, item_name, price, category, cas_v2_toppings_list))

print(f"\nBắt đầu ghi cho {NUM_ITEMS} mẫu...")

start = time.time()
mongo_collection.insert_many(mongo_data, ordered=False)
mongo_time = time.time() - start
print(f"MongoDB Write: {mongo_time:.2f} giây")

print("\n[1/2] Đang ghi Cassandra V1 (Normalized)")
start = time.time()
q_item_v1 = cas_session.prepare("INSERT INTO menu_items (id, restaurant_id, name, price, category) VALUES (?, ?, ?, ?, ?)")
q_top_v1 = cas_session.prepare("INSERT INTO item_toppings (item_id, topping_name, extra_price, is_available) VALUES (?, ?, ?, ?)")

execute_concurrent_with_args(cas_session, q_item_v1, cas_v1_items, concurrency=100)
execute_concurrent_with_args(cas_session, q_top_v1, cas_v1_toppings, concurrency=100)
cas_v1_time = time.time() - start
print(f"\nCassandra V1 ghi: {cas_v1_time:.2f} giây\n")

print("\n[2/2] Đang ghi Cassandra V2 (Denormalized with UDT)")
start = time.time()
q_item_v2 = cas_session.prepare("INSERT INTO menu_items_v2 (id, restaurant_id, name, price, category, toppings) VALUES (?, ?, ?, ?, ?, ?)")

execute_concurrent_with_args(cas_session, q_item_v2, cas_v2_items, concurrency=100)
cas_v2_time = time.time() - start
print(f"\nCassandra V2 ghi: {cas_v2_time:.2f} giây\n")

mongo_client.close()
cas_cluster.shutdown()
