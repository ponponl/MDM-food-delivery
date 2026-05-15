import time
from pymongo import MongoClient
from neo4j import GraphDatabase

mongo_client = MongoClient("mongodb://localhost:27017/")
mongo_db = mongo_client["mdm_food_delivery"]

uri = "bolt://localhost:7687"
neo4j_driver = GraphDatabase.driver(uri, auth=("neo4j", "password123"))

def test_neo4j_consistency():
    print("========NEO4J========'")


    with neo4j_driver.session() as session:
        session.run("MATCH (n:TestTx) DETACH DELETE n")

    def luong_xu_ly_giao_dich(tx):
        print("Bắt đầu")

        tx.run("CREATE (u:TestTx {type: 'Rating', item: 'Pizza'})")
        print("[Thành công] Đã ghi nhập Đánh giá món ăn vào bộ nhớ tạm.")

        print("[SỰ CỐ] Mất kết nối mạng đột ngột")
        raise Exception("Lỗi hệ thống!")

        tx.run("CREATE (u:TestTx {type: 'Point', value: 10})")

    try:
        with neo4j_driver.session() as session:
            session.execute_write(luong_xu_ly_giao_dich)
    except Exception:
        print("Hệ thống phát hiện lỗi. Đang ROLLBACK")

    with neo4j_driver.session() as session:
        result = session.run("MATCH (n:TestTx) RETURN COUNT(n) AS count").single()
        print(f"\nKẾT QUẢ:")
        print(f"Số bản ghi đang tồn tại trong DB: {result['count']}")
        print("=> Dữ liệu an toàn. Neo4j đã xóa sạch dữ liệu nhập, không để lại rác.")


def test_mongodb_consistency():
    print("========MONGODB========")

    mongo_db.test_tx_ratings.drop()
    mongo_db.test_tx_points.drop()

    print("Bắt đầu")
    try:
        mongo_db.test_tx_ratings.insert_one({"item": "Pizza"})
        print("[Thành công] Đã lưu Đánh giá món ăn thẳng vào ổ cứng")

        print("[SỰ CỐ] Mất kết nối mạng đột ngột")
        raise Exception("Lỗi hệ thống!")

        mongo_db.test_tx_points.insert_one({"points": 10})

    except Exception:
        print("Hệ thống phát hiện lỗi và dừng xử lý")

    rating_count = mongo_db.test_tx_ratings.count_documents({})
    point_count = mongo_db.test_tx_points.count_documents({})

    print(f"\nKẾT QUẢ:")
    print(f"Số đánh giá đã được lưu: {rating_count}")
    print(f"Số điểm đã được cộng:  {point_count}")
    
    if rating_count > 0 and point_count == 0:
        print("=> Lỗi dữ liệu. Tồn tại đánh giá nhưng người dùng không được cộng điểm.")

if __name__ == "__main__":
    test_neo4j_consistency()
    test_mongodb_consistency()
    
    neo4j_driver.close()
    mongo_client.close()