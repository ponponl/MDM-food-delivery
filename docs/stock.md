# Refactor Inventory System for Food Delivery App

We are refactoring the inventory flow for the food delivery system.

Current architecture stores menu items inside the `restaurant` collection as an embedded array.

The menu item now look like:

```js
{
  _id,
  name,
  price,
  category,
  available,
  stock,
  description
}
```

Notes:

* `available` is a business toggle flag.
* `stock` is the default inventory quantity configuration for new days.
* Do NOT store runtime sold quantity inside restaurant documents anymore.

---

# Goal

Implement a production-oriented inventory system with:

* daily inventory tracking
* atomic inventory updates
* anti-oversell protection
* daily inventory isolation
* order cancellation rollback

---

# Required Refactor

## 1. Create new collection: menu_inventory_daily

Create a new MongoDB collection:

```js
menu_inventory_daily
```

Schema:

```js
{
  _id,

  menuItemId,
  restaurantId,

  date, // normalized business date: YYYY-MM-DD

  totalQuantity,
  soldQuantity,

  createdAt,
  updatedAt
}
```

Example:

```js
{
  menuItemId: ObjectId(...),
  restaurantId: ObjectId(...),

  date: "2026-04-29",

  totalQuantity: 100,
  soldQuantity: 20
}
```

---

# 2. Inventory behavior

Inventory is now tracked per day.

Each menu item has a separate inventory document for each business day.

Important:

* DO NOT reset inventory daily.
* Instead, create/use a different document for each date.

---

# 3. Lazy inventory creation

Implement lazy creation strategy.

When the first order for a menu item arrives on a specific date:

1. Check if inventory document exists.
2. If not:

   * create inventory document
   * initialize:

     * totalQuantity = menu.stock
     * soldQuantity = 0

Do NOT pre-generate inventory for all menu items every day.

---

# 4. Atomic inventory update (CRITICAL)

When placing an order, inventory updates must be atomic to avoid overselling.

Use Mongo atomic update logic similar to:

```js
updateOne(
  {
    menuItemId,
    date,
    soldQuantity: { $lte: totalQuantity - orderedQuantity }
  },
  {
    $inc: {
      soldQuantity: orderedQuantity
    }
  }
)
```

Behavior:

* if update succeeds → inventory reserved successfully
* if update fails → item is out of stock

This logic must prevent race conditions during concurrent orders.

---

# 5. Order placement flow

New order flow:

1. Validate restaurant is open
2. Validate menu item exists
3. Validate menu.available === true
4. Get today's business date
5. Create inventory document if missing
6. Atomically increment soldQuantity
7. Create order document
8. Return success response

If inventory update fails:

* order creation must fail

---

# 6. Order cancellation rollback

When an order is cancelled or rejected:

Decrease soldQuantity:

```js
$inc: {
  soldQuantity: -quantity
}
```

Requirements:

* rollback must be idempotent
* prevent double rollback

---

# 7. Remaining quantity calculation

Do NOT store remaining quantity directly.

Remaining quantity must always be calculated:

```js
remainingQuantity = totalQuantity - soldQuantity
```

---

# 8. API changes

Update APIs to include inventory information.

Menu response should include:

```js
{
  available,
  totalQuantity,
  soldQuantity,
  remainingQuantity
}
```

Inventory data should come from `menu_inventory_daily`.

---

# 9. Timezone handling

Business date must use restaurant timezone, not server timezone.

Use restaurant timezone to derive:

```js
YYYY-MM-DD
```

Do NOT use raw UTC date directly.

---

# 10. Important architectural rules

DO:

* keep restaurant menu lightweight
* separate config state from runtime inventory state
* use atomic inventory updates
* use daily inventory documents

DO NOT:

* store soldQuantity inside restaurant documents
* reset inventory via cron
* keep inventory history inside arrays
* cache inventory for now

---

# 11. Expected outcome

After refactor:

* inventory becomes scalable
* overselling is prevented
* daily tracking is supported
* analytics become easier
* restaurant documents stay lightweight
* concurrency handling improves significantly
