import time
import json
from pymongo import MongoClient
from cassandra.cluster import Cluster

mongo_client = MongoClient("mongodb://127.0.0.1:27017/")
mongo_collection = mongo_client["mdm_benchmark"]["menu_items"] 
cas_cluster = Cluster(['127.0.0.1'], port=9042)
cas_session = cas_cluster.connect("mdm_benchmark")

cas_session.execute("CREATE INDEX IF NOT EXISTS idx_cat_v2 ON menu_items_v2 (category)")

print("\n======== BẮT ĐẦU TRUY VẤN ==========")
iterations = 500 

mongo_collection.create_index([
    ("category", 1),
    ("price", -1),
    ("toppings.name", 1)
])

start_time = time.time()
for _ in range(iterations):
    pipeline = [
        {"$match": {
            "category": "Drink",
            "price": {"$gte": 50000, "$lte": 100000},
            "toppings.name": "Phô mai"  
        }},
        {"$sort": {"price": -1}},
        {"$limit": 10}
    ]
    results = list(mongo_collection.aggregate(pipeline))

mongo_complex_time = time.time() - start_time
print(f"\nMongoDB:   {mongo_complex_time:.4f} giây\n")

cas_session.execute("CREATE INDEX IF NOT EXISTS idx_cat_v1 ON menu_items (category)")

start_time = time.time()
for _ in range(iterations):
    query_v1 = "SELECT id, name, price FROM menu_items WHERE category = 'Drink' LIMIT 100 ALLOW FILTERING"
    try:
        items = list(cas_session.execute(query_v1))
        
        final_results = []
        for item in items:
            if 50000 <= item.price <= 100000:
                topping_query = "SELECT topping_name FROM item_toppings WHERE item_id = %s AND topping_name = 'Phô mai'"
                has_topping = cas_session.execute(topping_query, [item.id]).one()
                if has_topping:
                    final_results.append(item)
        
        sorted_v1 = sorted(final_results, key=lambda x: x.price, reverse=True)[:10]
    except Exception as e:
        print(f"V1 lỗi tại vòng lặp: {e}")
        break 

cas_v1_complex_time = time.time() - start_time
print(f"Cassandra V1 (Normalized): {cas_v1_complex_time:.4f} giây")

start_time = time.time()

cas_complex_query = """
    SELECT * FROM menu_items_v2 
    WHERE category = 'Drink' 
    LIMIT 100
    ALLOW FILTERING
"""

for _ in range(iterations):
    rows = list(cas_session.execute(cas_complex_query))
    sorted_rows = sorted(rows, key=lambda x: x.price, reverse=True)[:10]

cas_v2_complex_time = time.time() - start_time
print(f"\nCassandra V2: {cas_v2_complex_time:.4f} giây\n")

mongo_client.close()
cas_cluster.shutdown()