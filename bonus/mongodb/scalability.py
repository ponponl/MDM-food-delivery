import time
from pymongo import MongoClient
from cassandra.cluster import Cluster

mongo_client = MongoClient("mongodb://127.0.0.1:27017/")
mongo_collection = mongo_client["mdm_benchmark"]["menu_items"]

cas_cluster = Cluster(['127.0.0.1'], port=9042)
cas_session = cas_cluster.connect("mdm_benchmark")

class ToppingTypeV3:
    def __init__(self, name, extra_price, is_available, luong_calo=None):
        self.name = name
        self.extra_price = extra_price
        self.is_available = is_available
        self.luong_calo = luong_calo

cas_cluster.register_user_type('mdm_benchmark', 'topping_type', ToppingTypeV3)

all_docs = list(mongo_collection.find({}, {"_id": 1}).limit(500))
test_ids = [doc["_id"] for doc in all_docs]
sample_id = test_ids[0] 

try: cas_session.execute("ALTER TABLE item_toppings ADD luong_calo int")
except: pass
try: cas_session.execute("ALTER TYPE topping_type ADD luong_calo int")
except: pass

print("\n=========== CẬP NHẬT 1 MÓN ĂN ==========")

start = time.time()
mongo_collection.update_one({"_id": sample_id}, {"$set": {"toppings.0.luong_calo": 150}})
print(f"\nMongoDB: {time.time() - start:.4f} giây\n")

start = time.time()
cas_session.execute("UPDATE item_toppings SET luong_calo = 150 WHERE item_id = %s AND topping_name = 'Trân châu đen'", (sample_id,))
print(f"Cassandra V1: {time.time() - start:.4f} giây\n")

start = time.time()
row = cas_session.execute("SELECT toppings FROM menu_items_v2 WHERE id = %s", (sample_id,)).one()
if row and row.toppings:
    new_tops = [ToppingTypeV3(t.name, t.extra_price, t.is_available, 150) for t in row.toppings]
    cas_session.execute("UPDATE menu_items_v2 SET toppings = %s WHERE id = %s", (new_tops, sample_id))
print(f"Cassandra V2: {time.time() - start:.4f} giây\n")

print("\n=========== CẬP NHẬT HÀNG LOẠT 500 MÓN ĂN ==========")

start = time.time()
mongo_collection.update_many({"_id": {"$in": test_ids}}, {"$set": {"toppings.0.luong_calo": 200}})
print(f"\nMongoDB: {time.time() - start:.4f} giây\n")

start = time.time()
for item_id in test_ids:
    cas_session.execute("UPDATE item_toppings SET luong_calo = 200 WHERE item_id = %s AND topping_name = 'Trân châu đen'", (item_id,))
print(f"Cassandra V1: {time.time() - start:.4f} giây\n")

start = time.time()
for item_id in test_ids:
    row = cas_session.execute("SELECT toppings FROM menu_items_v2 WHERE id = %s", (item_id,)).one()
    if row and row.toppings:
        new_tops = [ToppingTypeV3(t.name, t.extra_price, t.is_available, 200) for t in row.toppings]
        cas_session.execute("UPDATE menu_items_v2 SET toppings = %s WHERE id = %s", (new_tops, item_id))
print(f"Cassandra V2: {time.time() - start:.4f} giây\n")

mongo_client.close()
cas_cluster.shutdown()