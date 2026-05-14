import time
from pymongo import MongoClient
from neo4j import GraphDatabase

mongo_client = MongoClient("mongodb://localhost:27017/")
mongo_db = mongo_client["mdm_food_delivery"]
mongo_ratings = mongo_db["ratings"]

uri = "bolt://localhost:7687"
neo4j_driver = GraphDatabase.driver(uri, auth=("neo4j", "password123"))

def rollback_schema_changes():
    print("\n" + "="*60)
    print("ROLLBACK SCHEMA: XÓA CÁC TRƯỜNG DỮ LIỆU VỪA THÊM")
    print("="*60)
    
    print("\n-> [MongoDB] Đang gỡ bỏ các fields...")
    start_mongo = time.time()
    
    mongo_result = mongo_ratings.update_many(
        {}, 
        {"$unset": {
            "delivery_time_mins": "", 
            "order_context": ""
        }}
    )
    
    end_mongo = time.time() - start_mongo
    print(f" => [MongoDB] Đã xóa fields cho {mongo_result.modified_count} documents.")
    print(f" => [MongoDB] Thời gian Rollback: {end_mongo:.2f} giây")

    print("\n-> [Neo4j] Đang gỡ bỏ properties...")
    start_neo4j = time.time()
    
    cypher_rollback = """
    MATCH ()-[r:RATED]->()
    CALL { 
        WITH r 
        REMOVE r.delivery_time_mins, r.order_context 
    } IN TRANSACTIONS OF 10000 ROWS
    """
    
    with neo4j_driver.session() as session:
        session.run(cypher_rollback)
        
    end_neo4j = time.time() - start_neo4j
    print(f" => [Neo4j] Đã xóa properties trên toàn bộ relationship [RATED].")
    print(f" => [Neo4j] Thời gian Rollback: {end_neo4j:.2f} giây")

if __name__ == "__main__":
    rollback_schema_changes()
    neo4j_driver.close()
    mongo_client.close()
    print("\nHoàn tất Rollback dữ liệu về trạng thái ban đầu!")