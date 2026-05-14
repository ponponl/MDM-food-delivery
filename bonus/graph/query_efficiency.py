import time
from pymongo import MongoClient
from neo4j import GraphDatabase

mongo_client = MongoClient("mongodb://localhost:27017/")
mongo_db = mongo_client["mdm_food_delivery"]
mongo_ratings = mongo_db["ratings"]

uri = "bolt://localhost:7687"
neo4j_driver = GraphDatabase.driver(uri, auth=("neo4j", "password123"))

def run_3hop_benchmark():
    sample = mongo_ratings.find_one()
    if not sample: return
    test_user = sample["userId"]
    
    print(f"\nTRUY VẤN GỢI Ý (USER -> ITEM -> USER -> ITEM -> USER)")
    print(f"User: {test_user}")

    neo4j_3hop_query = """
    MATCH (u:User {id: $userId})-[:RATED]->(i1:Item)<-[:RATED]-(sim1:User)
    WITH u, sim1, COUNT(i1) AS common 
    ORDER BY common DESC LIMIT 100  // Chỉ lấy 100 người giống mình nhất (Tỉa cành 1)

    MATCH (sim1)-[:RATED]->(i2:Item)<-[:RATED]-(sim2:User)
    WHERE sim2 <> u AND sim1 <> sim2
    WITH u, sim2, COUNT(i2) AS common_deep
    ORDER BY common_deep DESC LIMIT 100 // Chỉ lấy 100 người giống của giống (Tỉa cành 2)

    MATCH (sim2)-[r:RATED]->(rec:Item)
    WHERE r.rating >= 4 AND NOT (u)-[:RATED]->(rec)
    RETURN rec.id AS ItemId, COUNT(*) AS score
    ORDER BY score DESC LIMIT 10
    """
    
    start_neo = time.time()
    with neo4j_driver.session() as session:
        neo_res = session.run(neo4j_3hop_query, userId=test_user).data()
    end_neo = time.time() - start_neo
    print(f"\nNeo4j: {end_neo:.4f} giây\n")
    start_mongo = time.time()
    
    user_rated_docs = list(mongo_ratings.find({"userId": test_user}, {"itemId": 1}))
    i1_ids = [d["itemId"] for d in user_rated_docs]
    
    sim1_docs = list(mongo_ratings.find({"itemId": {"$in": i1_ids}}, {"userId": 1}).limit(200))
    sim1_ids = list(set([d["userId"] for d in sim1_docs])) # Loại trùng
    
    i2_docs = list(mongo_ratings.find({"userId": {"$in": sim1_ids}}, {"itemId": 1}))
    i2_ids = list(set([d["itemId"] for d in i2_docs]))
    
    sim2_docs = list(mongo_ratings.find({"itemId": {"$in": i2_ids}, "userId": {"$ne": test_user}}, {"userId": 1}))
    sim2_ids = list(set([d["userId"] for d in sim2_docs]))
    
    mongo_rec = list(mongo_ratings.aggregate([
        {"$match": {"userId": {"$in": sim2_ids}, "rating": {"$gte": 4}, "itemId": {"$nin": i1_ids}}},
        {"$group": {"_id": "$itemId", "score": {"$sum": 1}}},
        {"$sort": {"score": -1}},
        {"$limit": 10}
    ]))
    
    end_mongo = time.time() - start_mongo
    print(f"MongoDB: {end_mongo:.4f} giây\n")

if __name__ == "__main__":
    run_3hop_benchmark()
    neo4j_driver.close()
    mongo_client.close()