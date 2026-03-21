# SPEC: Food Delivery Order Flow
## Luồng Đặt Món → Thanh Toán → Giao Hàng

---

## 1. TỔNG QUAN LUỒNG NGHIỆP VỤ

```
User browses menu
     ↓
Add item to cart (Redis - temporary storage)
     ↓
Checkout → Create Order (PostgreSQL)
     ↓
Payment (COD only) → Order confirmed
     ↓
Restaurant confirms order
     ↓
Delivery in progress
     ↓
Order completed
```

**Trạng thái đơn hàng:**
- `placed` - Đơn hàng mới tạo, chờ xác nhận
- `confirmed` - Nhà hàng đã xác nhận
- `delivering` - Đang giao hàng
- `completed` - Hoàn thành
- `cancelled` - Đã hủy

---

## 2. REDIS DATA STRUCTURES

### 2.1 Shopping Cart
```
Key: cart:{userExternalId}
Type: HASH
Structure:
{
  "itemId_1": "quantity1",
  "itemId_2": "quantity2",
  ...
}

Example:
cart:8892_daihiew
{
  "12": "2",
  "45": "1"
}

TTL: 24 hours (86400 seconds)
```

### 2.2 Menu Item Cache (Optional - for performance)
```
Key: menu:item:{itemId}
Type: HASH
Structure:
{
  "name": "Phở bò",
  "price": "50000",
  "restaurantId": "res_22",
  "available": "true"
}

TTL: 1 hour (3600 seconds)
```

### 2.3 Active Orders (for real-time tracking)
```
Key: order:active:{orderId}
Type: HASH
Structure:
{
  "status": "delivering",
  "driverId": "driver_123",
  "estimatedTime": "1520",
  "lastUpdate": "2026-03-07T10:30:00Z"
}

TTL: Expires after order completed + 1 hour
```

---

## 3. API SPECIFICATIONS

### 3.1 Cart Management

#### 3.1.1 Add Item to Cart
```http
POST /api/cart/items
Content-Type: application/json
```

**Request:**
```json
{
  "userExternalId": "8892_daihiew",
  "itemId": "12",
  "quantity": 2
}
```

**Validation:**
- `userExternalId`: Required, string
- `itemId`: Required, string/number
- `quantity`: Required, integer > 0

**Flow:**
1. Validate input
2. Check if item exists in menu (optional cache check)
3. Redis: `HINCRBY cart:{userExternalId} {itemId} {quantity}`
4. Redis: `EXPIRE cart:{userExternalId} 86400`
5. Return cart summary

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Item added to cart",
  "cart": {
    "totalItems": 3,
    "items": [
      {
        "itemId": "12",
        "quantity": 2
      }
    ]
  }
}
```

**Response Error (400):**
```json
{
  "status": "error",
  "message": "Invalid quantity",
  "code": "INVALID_QUANTITY"
}
```

---

#### 3.1.2 Get Cart
```http
GET /api/cart?userExternalId={userExternalId}
```

**Query Parameters:**
- `userExternalId`: Required, string

**Flow:**
1. Redis: `HGETALL cart:{userExternalId}`
2. If empty, return empty cart
3. Fetch item details from menu service/cache
4. Calculate total price

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "itemId": "12",
        "name": "Phở bò",
        "price": 50000,
        "quantity": 2,
        "subtotal": 100000
      },
      {
        "itemId": "45",
        "name": "Cơm gà",
        "price": 35000,
        "quantity": 1,
        "subtotal": 35000
      }
    ],
    "totalItems": 3,
    "totalPrice": 135000
  }
}
```

**Response Empty Cart (200):**
```json
{
  "status": "success",
  "data": {
    "items": [],
    "totalItems": 0,
    "totalPrice": 0
  }
}
```

---

#### 3.1.3 Update Item Quantity
```http
PUT /api/cart/items
Content-Type: application/json
```

**Request:**
```json
{
  "userExternalId": "8892_daihiew",
  "itemId": "12",
  "quantity": 3
}
```

**Flow:**
1. Validate input
2. If quantity = 0, remove item: `HDEL cart:{userExternalId} {itemId}`
3. If quantity > 0, update: `HSET cart:{userExternalId} {itemId} {quantity}`
4. Return updated cart

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Cart updated",
  "cart": { ... }
}
```

---

#### 3.1.4 Remove Item from Cart
```http
DELETE /api/cart/items
Content-Type: application/json
```

**Request:**
```json
{
  "userExternalId": "8892_daihiew",
  "itemId": "12"
}
```

**Flow:**
1. Redis: `HDEL cart:{userExternalId} {itemId}`
2. Return updated cart

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Item removed from cart"
}
```

---

#### 3.1.5 Clear Cart
```http
DELETE /api/cart?userExternalId={userExternalId}
```

**Flow:**
1. Redis: `DEL cart:{userExternalId}`

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Cart cleared"
}
```

---

### 3.2 Order Management

#### 3.2.1 Create Order (Checkout)
```http
POST /api/orders
Content-Type: application/json
```

**Request:**
```json
{
  "userExternalId": "hdihdiq2_28278",
  "restaurantId": "res_22",
  "deliveryAddress": {
    "receiver": "Nguyen Van A",
    "phone": "0909123456",
    "address": "123 Nguyen Van Cu, Quan 5, TP.HCM"
  },
  "note": "Không hành"
}
```

**Validation:**
- `userExternalId`: Required, string
- `restaurantId`: Required, string
- `deliveryAddress`: Required, object
  - `receiver`: Required, string, max 255 chars
  - `phone`: Required, string, format: 10-11 digits
  - `address`: Required, string, max 500 chars
- `note`: Optional, string, max 500 chars

**Flow:**
```javascript
BEGIN TRANSACTION;

// Step 1: Get cart from Redis
cartItems = HGETALL cart:{userExternalId}
if (cartItems is empty) {
  return error: "Cart is empty"
}

// Step 2: Get or create user
SELECT id FROM users WHERE externalId = {userExternalId}
if (not exists) {
  INSERT INTO users (externalId, phone) 
  VALUES ({userExternalId}, {deliveryAddress.phone})
  RETURNING id
}

// Step 3: Get item prices from menu service
menuItems = fetchMenuItems(Object.keys(cartItems))
totalPrice = 0
orderItems = []

for each itemId in cartItems:
  itemPrice = menuItems[itemId].price
  quantity = cartItems[itemId]
  subtotal = itemPrice * quantity
  totalPrice += subtotal
  orderItems.push({
    itemId, 
    quantity, 
    price: itemPrice
  })

// Step 4: Create order
INSERT INTO orders (userId, restaurantId, totalPrice, status, deliveryAddress, created_at)
VALUES (userId, restaurantId, totalPrice, 'placed', deliveryAddress_JSON, NOW())
RETURNING id, externalId

// Step 5: Create order items
for each item in orderItems:
  INSERT INTO order_items (orderId, itemId, quantity, price)
  VALUES (orderId, item.itemId, item.quantity, item.price)

// Step 6: Create payment record
INSERT INTO payments (orderId, method, status)
VALUES (orderId, 'cash', 'pending')
RETURNING id, externalId

COMMIT TRANSACTION;

// Step 7: Clear cart from Redis
DEL cart:{userExternalId}

// Step 8: Create active order tracking in Redis
HSET order:active:{orderId} status "placed"
HSET order:active:{orderId} created_at {timestamp}
EXPIRE order:active:{orderId} 86400

// Step 9: Emit real-time event
emit('order:created', {orderId, userExternalId, status: 'placed'})
```

**Response Success (201):**
```json
{
  "status": "success",
  "message": "Order created successfully",
  "data": {
    "orderId": 555,
    "orderExternalId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "placed",
    "totalPrice": 135000,
    "paymentMethod": "cash",
    "paymentStatus": "pending",
    "estimatedDelivery": "30-45 minutes",
    "createdAt": "2026-03-07T10:30:00Z"
  }
}
```

**Response Error - Empty Cart (400):**
```json
{
  "status": "error",
  "message": "Cart is empty",
  "code": "CART_EMPTY"
}
```

**Response Error - Item Unavailable (400):**
```json
{
  "status": "error",
  "message": "Some items are unavailable",
  "code": "ITEM_UNAVAILABLE",
  "unavailableItems": ["12", "45"]
}
```

---

#### 3.2.2 Get Order Detail
```http
GET /api/orders/{orderExternalId}
```

**Path Parameters:**
- `orderExternalId`: UUID của order

**Flow:**
1. Query PostgreSQL for order details
2. Join with order_items, payments, users
3. Get real-time status from Redis if available
4. Return full order info

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "orderId": 555,
    "orderExternalId": "550e8400-e29b-41d4-a716-446655440000",
    "restaurantId": "res_22",
    "status": "delivering",
    "totalPrice": 135000,
    "deliveryAddress": {
      "receiver": "Nguyen Van A",
      "phone": "0909123456",
      "address": "123 Nguyen Van Cu, Quan 5, TP.HCM"
    },
    "items": [
      {
        "itemId": "12",
        "name": "Phở bò",
        "quantity": 2,
        "price": 50000,
        "subtotal": 100000
      }
    ],
    "payment": {
      "method": "cash",
      "status": "pending"
    },
    "tracking": {
      "driverId": "driver_123",
      "estimatedTime": "15 minutes",
      "lastUpdate": "2026-03-07T10:45:00Z"
    },
    "createdAt": "2026-03-07T10:30:00Z"
  }
}
```

**Response Error (404):**
```json
{
  "status": "error",
  "message": "Order not found",
  "code": "ORDER_NOT_FOUND"
}
```

---

#### 3.2.3 Get User Orders
```http
GET /api/orders?userExternalId={userExternalId}&status={status}&limit={limit}&offset={offset}
```

**Query Parameters:**
- `userExternalId`: Required, string
- `status`: Optional, enum (placed, confirmed, delivering, completed, cancelled)
- `limit`: Optional, default 20, max 100
- `offset`: Optional, default 0

**Flow:**
1. Get userId from users table by externalId
2. Query orders with filters
3. Return paginated results

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "orders": [
      {
        "orderId": 555,
        "orderExternalId": "550e8400-e29b-41d4-a716-446655440000",
        "restaurantId": "res_22",
        "status": "delivering",
        "totalPrice": 135000,
        "createdAt": "2026-03-07T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

### 3.3 Order Status Updates

#### 3.3.1 Confirm Order (Restaurant)
```http
PATCH /api/orders/{orderExternalId}/confirm
Content-Type: application/json
```

**Request:**
```json
{
  "estimatedPrepTime": 20
}
```

**Authorization:** Restaurant role required

**Flow:**
```javascript
BEGIN TRANSACTION;

// Step 1: Verify order exists and status
SELECT id, status FROM orders WHERE externalId = {orderExternalId}
if (status != 'placed') {
  return error: "Invalid order status"
}

// Step 2: Update order status
UPDATE orders 
SET status = 'confirmed' 
WHERE externalId = {orderExternalId}

COMMIT TRANSACTION;

// Step 3: Update Redis tracking
HSET order:active:{orderId} status "confirmed"
HSET order:active:{orderId} estimatedPrepTime {estimatedPrepTime}
HSET order:active:{orderId} confirmedAt {timestamp}

// Step 4: Emit real-time event
emit('order:confirmed', {
  orderId, 
  orderExternalId, 
  status: 'confirmed',
  estimatedPrepTime
})
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Order confirmed",
  "data": {
    "orderId": 555,
    "status": "confirmed",
    "estimatedPrepTime": 20
  }
}
```

**Response Error (400):**
```json
{
  "status": "error",
  "message": "Cannot confirm order with current status",
  "code": "INVALID_STATUS_TRANSITION"
}
```

---

#### 3.3.2 Start Delivery
```http
PATCH /api/orders/{orderExternalId}/deliver
Content-Type: application/json
```

**Request:**
```json
{
  "driverId": "driver_123",
  "estimatedDeliveryTime": 25
}
```

**Authorization:** Driver or Restaurant role

**Flow:**
```javascript
BEGIN TRANSACTION;

// Verify order status must be 'confirmed'
UPDATE orders 
SET status = 'delivering' 
WHERE externalId = {orderExternalId} 
  AND status = 'confirmed'

if (rowCount == 0) {
  return error: "Invalid order status or not found"
}

COMMIT TRANSACTION;

// Update Redis tracking
HSET order:active:{orderId} status "delivering"
HSET order:active:{orderId} driverId {driverId}
HSET order:active:{orderId} estimatedTime {estimatedDeliveryTime}
HSET order:active:{orderId} deliveryStartedAt {timestamp}

// Emit real-time event
emit('order:delivering', {
  orderId, 
  orderExternalId,
  status: 'delivering',
  driverId,
  estimatedDeliveryTime
})
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Delivery started",
  "data": {
    "orderId": 555,
    "status": "delivering",
    "driverId": "driver_123",
    "estimatedDeliveryTime": 25
  }
}
```

---

#### 3.3.3 Complete Order
```http
PATCH /api/orders/{orderExternalId}/complete
Content-Type: application/json
```

**Request:**
```json
{
  "completedBy": "driver",
  "signature": "base64_image_string"
}
```

**Authorization:** Driver role

**Flow:**
```javascript
BEGIN TRANSACTION;

// Step 1: Verify and update order status
UPDATE orders 
SET status = 'completed' 
WHERE externalId = {orderExternalId} 
  AND status = 'delivering'

if (rowCount == 0) {
  return error: "Invalid order status"
}

// Step 2: Update payment status (COD paid)
UPDATE payments 
SET status = 'paid', paid_at = NOW()
WHERE orderId = (SELECT id FROM orders WHERE externalId = {orderExternalId})

COMMIT TRANSACTION;

// Step 3: Update Redis tracking
HSET order:active:{orderId} status "completed"
HSET order:active:{orderId} completedAt {timestamp}
EXPIRE order:active:{orderId} 3600  // Keep for 1 hour then delete

// Step 4: Emit real-time event
emit('order:completed', {
  orderId,
  orderExternalId,
  status: 'completed'
})

// Step 5: Trigger analytics/logging
logOrderCompletion(orderId)
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Order completed successfully",
  "data": {
    "orderId": 555,
    "status": "completed",
    "payment": {
      "status": "paid",
      "paidAt": "2026-03-07T11:15:00Z"
    }
  }
}
```

---

#### 3.3.4 Cancel Order
```http
PATCH /api/orders/{orderExternalId}/cancel
Content-Type: application/json
```

**Request:**
```json
{
  "reason": "Customer requested cancellation",
  "cancelledBy": "user"
}
```

**Authorization:** User or Restaurant role

**Flow:**
```javascript
BEGIN TRANSACTION;

// Can only cancel if status is 'placed' or 'confirmed'
UPDATE orders 
SET status = 'cancelled' 
WHERE externalId = {orderExternalId} 
  AND status IN ('placed', 'confirmed')

if (rowCount == 0) {
  return error: "Cannot cancel order at this stage"
}

// Update payment status
UPDATE payments 
SET status = 'failed'
WHERE orderId = (SELECT id FROM orders WHERE externalId = {orderExternalId})

COMMIT TRANSACTION;

// Update Redis
HSET order:active:{orderId} status "cancelled"
HSET order:active:{orderId} cancelledAt {timestamp}
EXPIRE order:active:{orderId} 3600

// Emit event
emit('order:cancelled', {orderId, orderExternalId, reason})
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Order cancelled",
  "data": {
    "orderId": 555,
    "status": "cancelled"
  }
}
```

**Response Error (400):**
```json
{
  "status": "error",
  "message": "Cannot cancel order in delivering status",
  "code": "INVALID_CANCELLATION"
}
```

---

## 4. REAL-TIME UPDATES

### 4.1 WebSocket Events

**Client subscribes:**
```javascript
// Client connects to WebSocket
socket.connect('ws://localhost:3000')

// Subscribe to order updates
socket.emit('subscribe:order', {
  orderExternalId: '550e8400-e29b-41d4-a716-446655440000'
})
```

**Server broadcasts events:**
```javascript
// Order status changed
socket.emit('order:status', {
  orderId: 555,
  orderExternalId: '550e8400-e29b-41d4-a716-446655440000',
  status: 'delivering',
  timestamp: '2026-03-07T10:45:00Z'
})

// Delivery location update (optional)
socket.emit('order:location', {
  orderId: 555,
  location: {
    lat: 10.762622,
    lng: 106.660172
  },
  timestamp: '2026-03-07T10:46:00Z'
})
```

**Events to implement:**
- `order:created` - New order placed
- `order:confirmed` - Restaurant confirmed
- `order:delivering` - Driver picked up, delivery started
- `order:completed` - Order delivered successfully
- `order:cancelled` - Order cancelled
- `order:location` - Driver location update (optional)

---

## 5. DATABASE OPERATIONS

### 5.1 Key Queries

#### Get Order with Full Details
```sql
SELECT 
  o.id,
  o.externalId,
  o.restaurantId,
  o.totalPrice,
  o.status,
  o.deliveryAddress,
  o.created_at,
  u.externalId as userExternalId,
  u.name as userName,
  u.phone as userPhone,
  p.method as paymentMethod,
  p.status as paymentStatus,
  p.paid_at as paymentPaidAt,
  json_agg(
    json_build_object(
      'itemId', oi.itemId,
      'quantity', oi.quantity,
      'price', oi.price
    )
  ) as items
FROM orders o
LEFT JOIN users u ON o.userId = u.id
LEFT JOIN payments p ON p.orderId = o.id
LEFT JOIN order_items oi ON oi.orderId = o.id
WHERE o.externalId = $1
GROUP BY o.id, u.externalId, u.name, u.phone, p.method, p.status, p.paid_at;
```

#### Get User Active Orders
```sql
SELECT 
  o.id,
  o.externalId,
  o.restaurantId,
  o.totalPrice,
  o.status,
  o.created_at
FROM orders o
JOIN users u ON o.userId = u.id
WHERE u.externalId = $1
  AND o.status IN ('placed', 'confirmed', 'delivering')
ORDER BY o.created_at DESC;
```

#### Update Order Status with Validation
```sql
UPDATE orders 
SET status = $2
WHERE externalId = $1 
  AND status = $3  -- Current expected status
RETURNING id, externalId, status;
```

### 5.2 Indexes for Performance
```sql
-- Orders table
CREATE INDEX idx_orders_user_id ON orders(userId);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_external_id ON orders(externalId);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_user_status ON orders(userId, status);

-- Payments table
CREATE INDEX idx_payments_order_id ON payments(orderId);
CREATE INDEX idx_payments_status ON payments(status);

-- Order items table
CREATE INDEX idx_order_items_order_id ON order_items(orderId);

-- Users table  
CREATE INDEX idx_users_external_id ON users(externalId);
CREATE INDEX idx_users_phone ON users(phone);
```

---

## 6. ERROR HANDLING

### 6.1 Standard Error Codes

| Code | Message | HTTP Status |
|------|---------|-------------|
| CART_EMPTY | Cart is empty | 400 |
| ITEM_NOT_FOUND | Item not found | 404 |
| ITEM_UNAVAILABLE | Item is unavailable | 400 |
| INVALID_QUANTITY | Invalid quantity | 400 |
| ORDER_NOT_FOUND | Order not found | 404 |
| INVALID_STATUS_TRANSITION | Cannot change to this status | 400 |
| INVALID_CANCELLATION | Cannot cancel at this stage | 400 |
| PAYMENT_FAILED | Payment processing failed | 500 |
| DB_ERROR | Database error | 500 |
| REDIS_ERROR | Cache error | 500 |

### 6.2 Error Response Format
```json
{
  "status": "error",
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  },
  "timestamp": "2026-03-07T10:30:00Z"
}
```

---

## 7. VALIDATION RULES

### 7.1 Cart Validation
- Maximum 50 items per cart
- Quantity: 1-99 per item
- Cart expires after 24 hours
- All items must be from same restaurant (business rule)

### 7.2 Order Validation
- Minimum order value: 20,000 VND
- Maximum order value: 10,000,000 VND
- Delivery address required fields: receiver, phone, address
- Phone format: Vietnamese (10-11 digits, starts with 0)

### 7.3 Status Transition Rules
```
placed → confirmed ✓
placed → cancelled ✓
confirmed → delivering ✓
confirmed → cancelled ✓
delivering → completed ✓
delivering → cancelled ✗ (not allowed)
completed → * ✗ (terminal state)
cancelled → * ✗ (terminal state)
```

---

## 8. TESTING SCENARIOS

### 8.1 Happy Path
1. Add items to cart
2. View cart
3. Checkout (create order)
4. Restaurant confirms
5. Driver starts delivery
6. Order completed
7. Payment marked as paid

### 8.2 Edge Cases
- Empty cart checkout
- Item out of stock during checkout
- Duplicate add to cart
- Cancel after restaurant confirms
- Concurrent status updates
- Redis unavailable (fallback)

### 8.3 Performance Requirements
- Cart operations: < 50ms
- Order creation: < 500ms
- Status updates: < 200ms
- Real-time event delivery: < 100ms
- Support 1000 concurrent orders

---

## 9. IMPLEMENTATION CHECKLIST

### Phase 1: Cart Module
- [ ] Redis connection setup
- [ ] Add item to cart API
- [ ] Get cart API
- [ ] Update item quantity API
- [ ] Remove item API
- [ ] Clear cart API
- [ ] Cart expiration handler

### Phase 2: Order Module
- [ ] Create order API (checkout)
- [ ] Get order detail API
- [ ] Get user orders API
- [ ] Order status validation
- [ ] Transaction handling
- [ ] Menu service integration (mock)

### Phase 3: Status Updates
- [ ] Confirm order API
- [ ] Start delivery API
- [ ] Complete order API
- [ ] Cancel order API
- [ ] Status transition validation

### Phase 4: Real-time Updates
- [ ] WebSocket server setup
- [ ] Subscribe to order events
- [ ] Broadcast status changes
- [ ] Redis pub/sub integration
- [ ] Client reconnection handling

### Phase 5: Testing & Optimization
- [ ] Unit tests
- [ ] Integration tests
- [ ] Load testing
- [ ] Database indexing
- [ ] Redis caching strategy
- [ ] Error monitoring

---

## 10. MOCK DATA FOR TESTING

### Menu Items Mock
```javascript
const MENU_MOCK = {
  "12": {
    itemId: "12",
    name: "Phở bò",
    price: 50000,
    restaurantId: "res_22",
    available: true
  },
  "45": {
    itemId: "45",
    name: "Cơm gà",
    price: 35000,
    restaurantId: "res_22",
    available: true
  },
  "67": {
    itemId: "67",
    name: "Bún chả",
    price: 40000,
    restaurantId: "res_22",
    available: false
  }
};
```

### Test Users
```javascript
const TEST_USERS = {
  user1: {
    externalId: "8892_daihiew",
    name: "Nguyen Van A",
    phone: "0909123456"
  },
  user2: {
    externalId: "hdihdiq2_28278",
    name: "Tran Thi B",
    phone: "0912345678"
  }
};
```

---

## 11. DEPLOYMENT NOTES

### Environment Variables
```env
# PostgreSQL
PG_URI=postgresql://user:password@localhost:5432/food_delivery

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
NODE_ENV=production

# Business Rules
CART_TTL=86400
ORDER_MIN_VALUE=20000
ORDER_MAX_VALUE=10000000
MAX_CART_ITEMS=50
```

### Health Check Endpoint
```http
GET /api/health

Response:
{
  "status": "healthy",
  "services": {
    "postgres": "connected",
    "redis": "connected",
    "websocket": "running"
  },
  "timestamp": "2026-03-07T10:30:00Z"
}
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-07  
**Author:** Development Team  
**Status:** Ready for Implementation
