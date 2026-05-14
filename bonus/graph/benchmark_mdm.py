import time
import random
from faker import Faker
from pymongo import MongoClient, UpdateOne
from neo4j import GraphDatabase
from datetime import datetime

fake = Faker()

mongo_client = MongoClient("mongodb://mongodb:27017/")
mongo_db = mongo_client["mdm_food_delivery"]
mongo_ratings = mongo_db["ratings"]

uri = "bolt://neo4j:7687"
neo4j_driver = GraphDatabase.driver(uri, auth=("neo4j", "password123"))

def run_insert_benchmark():
    print("Đang dọn dẹp dữ liệu cũ")
    
    mongo_ratings.drop()
    
    with neo4j_driver.session() as session:
        session.run("MATCH (n) CALL (n) { DETACH DELETE n } IN TRANSACTIONS OF 10000 ROWS")
        
    print("Dọn dẹp xong - Bắt đầu tạo mới\n")

    NUM_USERS = 10000       
    NUM_ITEMS = 5000        
    NUM_RATINGS = 500000    

    user_ids = [fake.uuid4() for _ in range(NUM_USERS)]
    item_ids = [fake.uuid4() for _ in range(NUM_ITEMS)]

    mock_ratings = []
    for _ in range(NUM_RATINGS):
        mock_ratings.append({
            "userId": random.choice(user_ids),
            "itemId": random.choice(item_ids),
            "rating": random.randint(1, 5)
        })

    print(f"\n--- BẮT ĐẦU GHI ({NUM_RATINGS} bản ghi) ---")

    start_mongo = time.time()
    
    mongo_ratings.create_index([("userId", 1), ("itemId", 1)])
    mongo_ratings.create_index("itemId")
    
    mongo_requests = [
        UpdateOne(
            {"userId": r["userId"], "itemId": r["itemId"]},
            {"$set": {"rating": r["rating"], "timestamp": datetime.now()}},
            upsert=True
        ) for r in mock_ratings
    ]
    mongo_ratings.bulk_write(mongo_requests)
    
    end_mongo = time.time() - start_mongo
    print(f"\nMongoDB: {end_mongo:.2f} giây\n")

    start_neo4j = time.time()
    
    with neo4j_driver.session() as session:
        session.run("CREATE INDEX user_id_index IF NOT EXISTS FOR (u:User) ON (u.id)")
        session.run("CREATE INDEX item_id_index IF NOT EXISTS FOR (i:Item) ON (i.id)")
        
        cypher_bulk_query = """
        UNWIND $batch AS r
        MERGE (u:User {id: r.userId})
        MERGE (i:Item {id: r.itemId})
        MERGE (u)-[rel:RATED]->(i)
        SET rel.rating = toInteger(r.rating), rel.timestamp = datetime()
        """
        session.run(cypher_bulk_query, batch=mock_ratings)
        
    end_neo4j = time.time() - start_neo4j
    print(f"\nNeo4j: {end_neo4j:.2f} giây\n")

if __name__ == "__main__":
    run_insert_benchmark()
    neo4j_driver.close()
    mongo_client.close()
    print("Hoàn tất chèn dữ liệu!")