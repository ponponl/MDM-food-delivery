import time
from pymongo import MongoClient
from neo4j import GraphDatabase

mongo_client = MongoClient("mongodb://localhost:27017/")
mongo_db = mongo_client["mdm_food_delivery"]
mongo_ratings = mongo_db["ratings"]

uri = "bolt://localhost:7687"
neo4j_driver = GraphDatabase.driver(uri, auth=("neo4j", "password123"))

def test_schema_scalability():
    print("==========SCHEMA SCALABILITY========")

    print("\nĐang cập nhật MongoDB\n")
    start_mongo = time.time()
    
    mongo_result = mongo_ratings.update_many(
        {}, 
        {"$set": {
            "delivery_time_mins": 30, 
            "order_context": "Trời mưa ngập đường"
        }}
    )
    
    end_mongo = time.time() - start_mongo
    print(f"[MongoDB] Đã thêm 2 fields mới cho {mongo_result.modified_count} documents.")
    print(f"[MongoDB] Thời gian Alter Schema: {end_mongo:.2f} giây")
    
    print("\nĐang cập nhật Neo4j\n")
    start_neo4j = time.time()
    
    cypher_alter_schema = """
    MATCH ()-[r:RATED]->()
    CALL (r) { 
        SET r.delivery_time_mins = 30, r.order_context = 'Trời mưa ngập đường' 
    } IN TRANSACTIONS OF 10000 ROWS
    """
    
    with neo4j_driver.session() as session:
        session.run(cypher_alter_schema)
        
    end_neo4j = time.time() - start_neo4j
    print(f"[Neo4j] Đã thêm 2 properties mới cho toàn bộ relationship [RATED].")
    print(f"[Neo4j] Thời gian Alter Schema: {end_neo4j:.2f} giây\n")

if __name__ == "__main__":
    test_schema_scalability()
    neo4j_driver.close()
    mongo_client.close()