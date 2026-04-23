# Redis trong du an

## 1. Muc dich su dung
Redis được dùng để lưu trữ dữ liệu tạm thời và phục vụ truy xuất nhanh:
- Giỏ hàng (cart) theo người dùng và nhà hàng.
- Theo dõi trạng thái đơn hàng thời gian thực (active order).

Du lieu lau dai van nam o PostgreSQL/MongoDB. Redis chi dong vai tro cache/tam thoi.

## 2. Ket noi Redis
- Client: backend/src/config/redis.js su dung redis.createClient({ url: REDIS_URL }).
- Ket noi: backend/src/server.js goi redisClient.connect() khi server khoi dong.
- Docker: docker-compose.yml chay redis:latest tren cong 6379.

## 3. Thiet ke key Redis

### 3.1. Gio hang (cart)
| Key | Type | Muc dich | TTL | Ghi chu |
| --- | --- | --- | --- | --- |
| cart:{userExternalId}:{restaurantPublicId} | HASH | Luu danh sach item trong gio hang theo nha hang | 86400s | value la JSON cua item, key la itemKey |
| cart:{userExternalId}:{restaurantPublicId}:totalQty | STRING | Tong so luong item trong gio hang cua nha hang | 86400s | Dong bo voi cart hash |
| cart:{userExternalId}:restaurants | SET | Danh sach restaurantPublicId ma user dang co gio hang | 86400s | Dung de lay tong quan cart cua user |

### 3.2. Cache restaurant va menu
| Key | Type | Muc dich | TTL | Ghi chu |
| --- | --- | --- | --- | --- |
| restaurants:info:{publicId} | STRING (JSON) | Luu thong tin nha hang (khong gom menu) | 300s | setEx trong restaurantController |
| restaurants:menu:{publicId} | STRING (JSON) | Luu menu nha hang | 300s | setEx trong restaurantController |

### 3.3. Active order tracking
| Key | Type | Muc dich | TTL | Ghi chu |
| --- | --- | --- | --- | --- |
| order:active:{orderId} | HASH | Theo doi trang thai don hang thoi gian thuc | 86400s khi tao, 3600s sau khi hoan thanh/huy | Cap nhat theo cac buoc placed/confirmed/delivering/completed/cancelled |

Cac field da duoc set tren key active order:
- status
- created_at
- confirmedAt
- deliveryStartedAt
- completedAt
- cancelledAt
- driverId
- estimatedPrepTime
- estimatedTime
- cancelReason

## 4. Thiet ke itemKey cho cart
File: backend/src/modules/cart/cartItemKey.js

Muc tieu: phan biet cung 1 item nhung option khac nhau (size, topping, v.v.).

Cach tao itemKey:
1. Normalize options (sap xep theo ten, stable stringify value).
2. Tao chuoi signature: "name:value|name:value|...".
3. Hash SHA1 tren "{itemId}|{signature}".
4. Lay 16 ky tu dau cua hash.
5. Key cuoi cung: item:{hash16}.

Vi du (mo ta):
- itemId=12, options={size:large, spice:medium} -> item:{hash}

## 5. Lua scripts cho thao tac atom
File: backend/src/modules/cart/cartScripts.js

### 5.1. addOrUpdateItemLua
- Doc item cu (HGET) de tinh oldQty.
- Tinh delta = newQty - oldQty.
- HSET item JSON vao cart hash.
- INCRBY totalQty theo delta.
- SADD restaurant vao set restaurants.
- EXPIRE cho cart hash, totalQty, restaurants set (cung TTL).
- Tra ve totalQty hien tai.

### 5.2. deleteItemLua
- Doc item cu (HGET) de lay oldQty.
- HDEL item khoi cart hash.
- DECRBY totalQty theo oldQty.
- Neu cart rong (HLEN == 0): DEL cart hash, DEL totalQty, SREM restaurant khoi set.
- Tra ve totalQty hien tai.

## 6. Luong xu ly chinh lien quan Redis

### 6.1. Them/cap nhat/xoa item trong cart
- addItemToCart / updateItemQuantity: dung addOrUpdateItemLua de cap nhat atom.
- removeItemFromCart / removeItemsByKey: dung deleteItemLua.
- clearCart / clearCartByRestaurant: dung pipeline (multi/exec) de xoa nhieu key.

### 6.2. Tao don hang
- Lay cart tu Redis (getCartItems / getCartItemsByKeys).
- Sau khi tao order trong DB: clearCartByRestaurant hoac removeItemsByKey.
- Tao active order key: order:active:{orderId} voi status=placed, created_at, TTL 86400s.

### 6.3. Cap nhat trang thai don hang
- confirmOrder: hSet status=confirmed, estimatedPrepTime, confirmedAt.
- startDelivery: hSet status=delivering, driverId, estimatedTime, deliveryStartedAt.
- completeOrder: hSet status=completed, completedAt; expire 3600s.
- cancelOrder: hSet status=cancelled, cancelledAt, cancelReason; expire 3600s.

## 7. Luu y thiet ke
- TTL duoc gan dong bo cho ca 3 key gio hang (cart hash, totalQty, restaurants set).
- Lua script dam bao tinh nhat quan khi cap nhat so luong va don nhat item.
- Key namespace ro rang: cart:..., restaurants:..., order:active:...
- Cart duoc tach theo restaurantPublicId de tranh xung dot va ho tro nhieu nha hang.

## 8. Noi tham chieu trong code
- backend/src/config/redis.js
- backend/src/server.js
- backend/src/modules/cart/cartService.js
- backend/src/modules/cart/cartScripts.js
- backend/src/modules/cart/cartItemKey.js
- backend/src/modules/order/orderService.js
- backend/src/modules/restaurant/restaurantController.js
