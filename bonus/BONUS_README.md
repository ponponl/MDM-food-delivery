# MDM Bonus - Multi-Database Benchmarks

Bộ benchmarks so sánh hiệu năng giữa các hệ thống database khác nhau (PostgreSQL, Cassandra, MongoDB, Redis, Neo4j) trong bối cảnh ứng dụng food delivery.

## Yêu cầu

- **Docker** (bất kỳ phiên bản gần đây)
- **Docker Compose** (đã bao gồm với Docker Desktop)
- **8GB RAM** tối thiểu (khuyến nghị 16GB)
- **20GB disk space** cho databases

## Cách chạy

### 1. Build và khởi động services

```bash
cd bonus
docker-compose build
docker-compose up -d
```

**Thời gian chờ:** ~2-3 phút cho tất cả databases sẵn sàng

### 2. Vào container chạy benchmarks

```bash
docker-compose exec benchmarks bash
```

### 3. Chọn benchmark muốn chạy

#### **Cassandra + PostgreSQL Benchmark**
```bash
python cassandra/benchmark_mdm.py
```
- So sánh insert performance: PostgreSQL vs Cassandra
- 500,000 records location tracking
- Kết quả: Thời gian chạy (seconds)

#### **MongoDB + Cassandra Benchmark**
```bash
python mongodb/benchmark_mdm.py
```
- So sánh cách lưu menu items (nested vs flattened schema)
- 50,000 menu items với toppings
- Kết quả: Memory usage, query performance

#### **Redis + PostgreSQL Benchmark**
```bash
python redis/benchmark_mdm.py
```
- So sánh cache vs database
- 10,000 restaurants với menu items
- Kết quả: Response time, throughput

#### **Neo4j + MongoDB Benchmark (Graph & Document)**
```bash
python graph/benchmark_mdm.py
```
- So sánh recommendation system: Document-based vs Graph-based
- 10,000 users, 5,000 items, 500,000 ratings
- Kết quả: Insert time, query complexity

## Databases có sẵn

| Database | Port | Connection |
|----------|------|-----------|
| PostgreSQL | 5433 | `psycopg2.connect(host='postgres', port='5432')` |
| Cassandra | 9042 | `Cluster(['cassandra'])` |
| MongoDB | 27017 | `MongoClient('mongodb://mongodb:27017/')` |
| Redis | 6379 | `redis.Redis(host='redis', port=6379)` |
| Neo4j | 7687 | `bolt://neo4j:7687` (user: neo4j, pass: password123) |

## Các lệnh hữu ích

### Xem logs của benchmarks
```bash
docker-compose logs -f benchmarks
```

### Xem logs của database cụ thể
```bash
docker-compose logs -f postgres
docker-compose logs -f cassandra
docker-compose logs -f mongodb
docker-compose logs -f redis
docker-compose logs -f neo4j
```

### Truy cập CLI tools
```bash
# PostgreSQL
docker-compose exec postgres psql -U postgres

# MongoDB
docker-compose exec mongodb mongosh

# Redis
docker-compose exec redis redis-cli

# Neo4j
docker-compose exec neo4j cypher-shell -u neo4j -p password123

# Cassandra
docker-compose exec cassandra cqlsh
```

### Dừng services
```bash
docker-compose down
```

### Xóa tất cả data (reset)
```bash
docker-compose down -v
```

## Cấu trúc project

```
bonus/
├── Dockerfile              # Build image cho Python
├── docker-compose.yml      # Orchestrate 5 databases + 1 Python container
├── requirements.txt        # Python dependencies
├── cassandra/
│   ├── benchmark_mdm.py   # PostgreSQL vs Cassandra insert benchmark
│   ├── consistency.py     # Test tính nhất quán dữ liệu
│   ├── query_efficiency.py # So sánh hiệu quả query
│   └── scalability.py     # Test khả năng mở rộng
├── mongodb/
│   ├── benchmark_mdm.py   # MongoDB vs Cassandra (nested schema)
│   ├── consistency.py     # Document consistency
│   ├── query_efficiency.py # Index & query optimization
│   └── rollback.py        # ACID compliance testing
├── redis/
│   ├── benchmark_mdm.py   # Redis cache vs PostgreSQL
│   ├── consistency.py     # Cache invalidation strategies
│   ├── query_efficiency.py # Hit rate & latency
│   └── rollback.py        # Data persistence
└── graph/
    ├── benchmark_mdm.py   # Neo4j vs MongoDB (recommendations)
    ├── consistency.py     # Graph traversal correctness
    ├── query_efficiency.py # Complex query performance
    └── rollback.py        # Transaction handling
```

## Chi tiết Benchmarks

### 1. **Cassandra Benchmark** (`cassandra/benchmark_mdm.py`)
- **Mục đích:** So sánh tốc độ insert dữ liệu location tracking
- **Data:** 500K orders, 500 drivers
- **Kết quả:** PostgreSQL time vs Cassandra time
- **Dùng cho:** Tracking orders (high write throughput)

### 2. **MongoDB Benchmark** (`mongodb/benchmark_mdm.py`)
- **Mục đích:** So sánh schema design (nested vs flattened)
- **Data:** 50K menu items với toppings
- **Kết quả:** Memory usage, query performance
- **Dùng cho:** Menu management (complex nested data)

### 3. **Redis Benchmark** (`redis/benchmark_mdm.py`)
- **Mục đích:** So sánh cache layer vs raw database
- **Data:** 10K restaurants, 100K menu items
- **Kết quả:** Response time comparison
- **Dùng cho:** Caching frequently accessed data

### 4. **Graph Benchmark** (`graph/benchmark_mdm.py`)
- **Mục đích:** So sánh recommendation system
- **Data:** 10K users, 5K items, 500K ratings
- **Kết quả:** Insert time, traversal performance
- **Dùng cho:** User-to-item recommendations (graph traversal)

## Troubleshooting

### "Connection refused" 
**Vấn đề:** Container Python không kết nối được database
```bash
# Giải pháp:
docker-compose logs postgres cassandra mongodb redis neo4j
# Chờ cho tất cả hiện "healthy" trước khi chạy benchmark
```

### "Out of Memory"
**Vấn đề:** Container chạy hết RAM
```bash
# Giải pháp: Giảm NUM_RECORDS trong script
# Ví dụ trong cassandra/benchmark_mdm.py:
# NUM_RECORDS = 500000  # Giảm xuống 100000
```

### "Port already in use"
**Vấn đề:** Port 5433, 9042, etc. đã được dùng
```bash
# Giải pháp: Dừng containers khác
docker ps
docker stop <container_id>
```

### Cassandra/Neo4j bị timeout
**Vấn đề:** Chúng mất lâu để start
```bash
# Giải pháp: Tăng timeout trong docker-compose.yml
# Chờ lâu hơn hoặc check logs
docker-compose logs cassandra
docker-compose logs neo4j
```

## Tips

1. **Chạy benchmark riêng lẻ:** Mỗi script là độc lập, có thể chạy mà không ảnh hưởng đến cái khác
2. **Xem kết quả:** Mỗi script in ra console kết quả benchmark
3. **Modify số records:** Sửa `NUM_RECORDS` hoặc `NUM_ITEMS` trong scripts để test với data lớn/nhỏ hơn
4. **Reset data:** Mỗi lần chạy benchmark đều tự động drop & recreate tables/collections
5. **Persist data:** Để lưu data giữa các lần restart, xóa `-v` flag khi chạy `docker-compose down`

## Ghi chú

- Tất cả connection strings đã được cấu hình để dùng **Docker service names** (postgres, cassandra, mongodb, redis, neo4j)
- Mỗi script **tự động reset data** trước khi chạy benchmark
- Port mapping cho phép debug ngoài container nếu cần
- Healthchecks đảm bảo databases sẵn sàng trước khi Python container start

## Học tập

Dùng benchmarks này để:
- Hiểu trade-offs giữa các database
- Học cách optimize query performance
- Test consistency models
- Benchmark scaling capabilities
- Quyết định database nào phù hợp cho từng use case

---

**Last updated:** 2026-05-15
