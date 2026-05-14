import time
import threading
import random
from pymongo import MongoClient
from cassandra.cluster import Cluster

mongo_client = MongoClient("mongodb://127.0.0.1:27017/")
mongo_coll = mongo_client["mdm_benchmark"]["menu_items"]

cas_cluster = Cluster(['127.0.0.1'], port=9042)
cas_session = cas_cluster.connect("mdm_benchmark")

ITEM_ID = "consistent_all_001"
TOPPING_NAME = "Trân châu"
NUM_THREADS = 100

class ToppingType(object):
    def __init__(self, name, extra_price, is_available):
        self.name = name
        self.extra_price = extra_price
        self.is_available = is_available
cas_cluster.register_user_type('mdm_benchmark', 'topping_type', ToppingType)

mongo_coll.delete_one({"_id": ITEM_ID})
mongo_coll.insert_one({"_id": ITEM_ID, "toppings": [{"name": TOPPING_NAME, "extra_price": 0.0}]})

cas_session.execute("INSERT INTO item_toppings (item_id, topping_name, extra_price) VALUES (%s, %s, 0)", (ITEM_ID, TOPPING_NAME))

cas_session.execute("DELETE FROM menu_items_v2 WHERE id = %s", (ITEM_ID,))
cas_session.execute(f"INSERT INTO menu_items_v2 (id, toppings) VALUES ('{ITEM_ID}', [{{name:'{TOPPING_NAME}', extra_price:0, is_available:true}}])")

print(f"Đã reset giá = 0đ. Bắt đầu chạy 100 luồng.")

def worker_mongo():
    mongo_coll.update_one(
        {"_id": ITEM_ID, "toppings.name": TOPPING_NAME},
        {"$inc": {"toppings.$.extra_price": 100}}
    )

def worker_cassandra_v1():
    row = cas_session.execute("SELECT extra_price FROM item_toppings WHERE item_id = %s AND topping_name = %s", (ITEM_ID, TOPPING_NAME)).one()
    new_price = row.extra_price + 100
    cas_session.execute("UPDATE item_toppings SET extra_price = %s WHERE item_id = %s AND topping_name = %s", (new_price, ITEM_ID, TOPPING_NAME))

def worker_cassandra_v2():
    row = cas_session.execute("SELECT toppings FROM menu_items_v2 WHERE id = %s", (ITEM_ID,)).one()
    if row and row.toppings:
        current_list = list(row.toppings)
        old_top = current_list[0]
        current_list[0] = ToppingType(old_top.name, old_top.extra_price + 100, old_top.is_available)
        cas_session.execute("UPDATE menu_items_v2 SET toppings = %s WHERE id = %s", (current_list, ITEM_ID))

def run_benchmark(name, func):
    threads = []
    for _ in range(NUM_THREADS):
        t = threading.Thread(target=func)
        threads.append(t)
        t.start()
    for t in threads:
        t.join()
    print(f"{name} hoàn thành.")

run_benchmark("MongoDB", worker_mongo)
run_benchmark("Cassandra V1", worker_cassandra_v1)
run_benchmark("Cassandra V2", worker_cassandra_v2)

print("\n=======KẾT QUẢ========")

price_m = mongo_coll.find_one({"_id": ITEM_ID})['toppings'][0]['extra_price']
price_v1 = cas_session.execute("SELECT extra_price FROM item_toppings WHERE item_id = %s AND topping_name = %s", (ITEM_ID, TOPPING_NAME)).one().extra_price
price_v2 = cas_session.execute("SELECT toppings FROM menu_items_v2 WHERE id = %s", (ITEM_ID,)).one().toppings[0].extra_price

print(f"\nMongoDB: {price_m:,.0f}đ")
print(f"\nCassandra V1: {price_v1:,.0f}đ")
print(f"\nCassandra V2: {price_v2:,.0f}đ\n")

cas_cluster.shutdown()
mongo_client.close()