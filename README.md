# ĐỒ ÁN THỰC HÀNH: HỆ THỐNG QUẢN LÝ GIAO ĐỒ ĂN TRỰC TUYẾN (FOOD DELIVERY PLATFORM)

* **Môn học:** CSC12111 - Quản trị cơ sở dữ liệu hiện đại
* **Mã số bài tập:** DATH
* **Giảng viên phụ trách:** Phạm Minh Tú
* **Đơn vị:** Khoa Công nghệ Thông tin - Trường ĐH Khoa học Tự nhiên

---

## 1. Giới thiệu dự án
Dự án tập trung xây dựng hệ thống quản lý ứng dụng giao đồ ăn trực tuyến. Mục tiêu cốt lõi là khảo sát nghiệp vụ, phân tích và đề xuất mô hình lưu trữ đa dạng bằng cách kết hợp SQL và NoSQL để tối ưu hóa hiệu suất cho các tập dữ liệu lớn và truy cập thường xuyên.

### Phân bổ Cơ sở dữ liệu & Chức năng:
Dựa trên phân tích đặc điểm dữ liệu, nhóm thống nhất kiến trúc đa cơ sở dữ liệu (Polyglot Persistence):

| Nhóm dữ liệu | Loại DB | Lý do lựa chọn & Nghiệp vụ |
| :--- | :--- | :--- |
| **User & Order** | **PostgreSQL** | Đảm bảo tính nhất quán (ACID) cho giao dịch thanh toán và lịch sử đơn hàng. |
| **Restaurant & Menu** | **MongoDB** | Cấu trúc JSON linh hoạt cho danh sách món ăn, giá và trạng thái thay đổi thường xuyên. |
| **Cart & Status** | **Redis** | Lưu trữ Key-Value trên RAM để truy xuất nhanh giỏ hàng tạm thời và trạng thái đơn hàng thời gian thực. |
| **Recommendations** | **Neo4j** | Truy vấn quan hệ (Graph) giữa User - Restaurant để gợi ý món ăn dựa trên hành vi người dùng. |

---

## 2. Công nghệ sử dụng
* **Frontend:** React (Vite), Axios, React Router.
* **Backend:** Node.js, Express.js.
* **Database Drivers:** `pg` (Postgres), `mongoose` (MongoDB), `redis`, `neo4j-driver`.
* **Cơ sở hạ tầng:** Docker & Docker Compose.

---

## 3. Hướng dẫn cài đặt cho thành viên

### Bước 1: Khởi chạy môi trường Database (Docker)
Tại thư mục gốc của dự án, chạy lệnh sau để khởi động đồng thời 4 loại cơ sở dữ liệu:
```bash
docker-compose up -d
```

### Bước 2: Thiết lập Backend
1. Truy cập folder: `cd backend`
2. Cài đặt thư viện: `npm install`
3. Tạo file `.env` từ mẫu `.env.example` và điền các chuỗi kết nối (URI/URL).
4. Khởi động server: `npm run dev`

### Bước 3: Thiết lập Frontend
1. Truy cập folder: `cd frontend`
2. Cài đặt thư viện: `npm install`
3. Khởi chạy giao diện: `npm run dev`

---

## 4. Cấu trúc thư mục (Monorepo)
```text
├── backend/
│   ├── src/
│   │   ├── configs/       # Cấu hình kết nối Postgres, Mongo, Redis, Neo4j
│   │   ├── modules/       # Các chức năng demo cho từng loại CSDL
│   │   └── server.js      # Điểm khởi chạy chính (Entry point)
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/           # Các hàm gọi API (Axios)
│   │   ├── components/    # Thành phần UI dùng chung
│   │   └── pages/         # Các màn hình chính (Menu, Cart, Orders...)
├── docker-compose.yml     # Quản lý container cho 4 Database
└── README.md
```

---

## 5. Quy trình làm việc nhóm (Git Workflow)
Để tránh xung đột mã nguồn khi làm việc song song:
1. **Branching:** Mỗi thành viên tạo nhánh riêng khi thực hiện chức năng (ví dụ: `feat/mongodb-menu`).
2. **Pull Requests:** Khi hoàn thành, tạo PR vào nhánh `develop` để các thành viên khác review.
3. **Environment:** Luôn cập nhật file `.env.example` nếu có biến môi trường mới.


