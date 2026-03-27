export const addOrUpdateItemLua = `
-- KEYS[1] = cartKey
-- KEYS[2] = totalQtyKey
-- KEYS[3] = restaurantsKey
-- ARGV[1] = itemKey
-- ARGV[2] = itemJSON
-- ARGV[3] = quantity
-- ARGV[4] = ttl (seconds)
-- ARGV[5] = restaurantId
local oldItem = redis.call('HGET', KEYS[1], ARGV[1])

local oldQty = 0
if oldItem then
  local decoded = cjson.decode(oldItem)
  if decoded and decoded.quantity then
    oldQty = tonumber(decoded.quantity) or 0
  end
end

local newQty = tonumber(ARGV[3]) or 0
local delta = newQty - oldQty

redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])

if delta ~= 0 then
  redis.call('INCRBY', KEYS[2], delta)
end

redis.call('SADD', KEYS[3], ARGV[5])

redis.call('EXPIRE', KEYS[1], ARGV[4])
redis.call('EXPIRE', KEYS[2], ARGV[4])
redis.call('EXPIRE', KEYS[3], ARGV[4])

local totalQty = redis.call('GET', KEYS[2])
if not totalQty then
  totalQty = 0
end

return tonumber(totalQty)
`;

export const deleteItemLua = `
-- KEYS[1] = cartKey
-- KEYS[2] = totalQtyKey
-- KEYS[3] = restaurantsKey
-- ARGV[1] = itemKey
-- ARGV[2] = restaurantId
local oldItem = redis.call('HGET', KEYS[1], ARGV[1])

if not oldItem then
  local current = redis.call('GET', KEYS[2])
  if not current then
    current = 0
  end
  return tonumber(current)
end

local decoded = cjson.decode(oldItem)
local oldQty = 0
if decoded and decoded.quantity then
  oldQty = tonumber(decoded.quantity) or 0
end

redis.call('HDEL', KEYS[1], ARGV[1])

if oldQty > 0 then
  redis.call('DECRBY', KEYS[2], oldQty)
end

local remaining = redis.call('HLEN', KEYS[1])
if remaining == 0 then
  redis.call('DEL', KEYS[1])
  redis.call('DEL', KEYS[2])
  redis.call('SREM', KEYS[3], ARGV[2])
end

local current = redis.call('GET', KEYS[2])
if not current then
  current = 0
end

return tonumber(current)
`;
