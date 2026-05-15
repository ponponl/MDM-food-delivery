from pymongo import MongoClient
from cassandra.cluster import Cluster

mongo_client = MongoClient("mongodb://127.0.0.1:27017/")
mongo_collection = mongo_client["mdm_benchmark"]["menu_items"]

cas_cluster = Cluster(['127.0.0.1'], port=9042)
cas_session = cas_cluster.connect("mdm_benchmark")

print("Đang bắt đầu Reverse Schema\n")

try:
    result = mongo_collection.update_many(
        {}, 
        {"$unset": {"toppings.$[].luong_calo": ""}}
    )
    print(f"MongoDB: Đã xóa field 'luong_calo' khỏi {result.modified_count} documents.\n")
except Exception as e:
    print(f"MongoDB Error: {e}")

try:
    cas_session.execute("ALTER TABLE item_toppings DROP luong_calo")
    print("Cassandra V1: Đã DROP column 'luong_calo' trong bảng item_toppings.\n")
except Exception as e:
    print(f"Cassandra V1 Error (Có thể cột đã bị xóa): {e}")


try:
    cas_session.execute("ALTER TYPE topping_type DROP luong_calo")
    print("Cassandra V2: Đã DROP field 'luong_calo' trong UDT topping_type.")
except Exception as e:
    print(f"Cassandra V2 Error: {e}\n")

mongo_client.close()
cas_cluster.shutdown()
