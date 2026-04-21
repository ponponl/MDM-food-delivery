import pgPool from '../../config/postgres.js';
import { buildOrdersPagination, mapOrderDetailRow, mapOrderSummaryRow } from './orderModel.js';

export class OrderRepository {
  async findUserByExternalId(client, userExternalId) {
    const executor = client ?? pgPool;
    const result = await executor.query(
      'SELECT id, phone, addresses FROM users WHERE externalId = $1',
      [userExternalId]
    );
    return result.rows[0] ?? null;
  }

  async findUserIdByExternalId(client, userExternalId) {
    const executor = client ?? pgPool;
    const result = await executor.query(
      'SELECT id FROM users WHERE externalId = $1',
      [userExternalId]
    );
    return result.rows[0]?.id ?? null;
  }

  async createUser(client, { userExternalId, phone, deliveryAddress }) {
    const result = await client.query(
      `INSERT INTO users (externalId, phone, addresses)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [userExternalId, phone, JSON.stringify([deliveryAddress])]
    );
    return result.rows[0].id;
  }

  async createOrder(client, { userId, restaurantId, totalPrice, totalItems, status, deliveryAddress }) {
    const result = await client.query(
      `INSERT INTO orders (userId, restaurantId, totalPrice, total_items, status, deliveryAddress, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, externalId, created_at`,
      [userId, restaurantId, totalPrice, totalItems, status, JSON.stringify(deliveryAddress)]
    );
    return result.rows[0];
  }

  async createOrderItems(client, orderId, items) {
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (orderId, itemId, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.itemId, item.quantity, item.price]
      );
    }
  }

  async createPayment(client, { orderId, method, status }) {
    const result = await client.query(
      `INSERT INTO payments (orderId, method, status)
       VALUES ($1, $2, $3)
       RETURNING id, externalId`,
      [orderId, method, status]
    );
    return result.rows[0];
  }

  async getOrderDetailByExternalId(orderExternalId) {
    const query = `
      SELECT
        o.externalId,
        o.restaurantId,
        o.totalPrice,
        o.total_items,
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
      GROUP BY o.id, u.externalId, u.name, u.phone, p.method, p.status, p.paid_at
    `;

    const result = await pgPool.query(query, [orderExternalId]);
    if (result.rows.length === 0) {
      return null;
    }

    return mapOrderDetailRow(result.rows[0]);
  }

  async getUserOrdersByExternalId({ userExternalId, status, limit, offset }) {
    const userId = await this.findUserIdByExternalId(pgPool, userExternalId);

    if (!userId) {
      return {
        orders: [],
        pagination: { total: 0, limit, offset, hasMore: false }
      };
    }

    let query = `
      SELECT
        o.externalId,
        o.restaurantId,
        o.status,
        o.totalPrice,
        o.total_items,
        o.created_at,
        COUNT(*) OVER() as total_count
      FROM orders o
      WHERE o.userId = $1
    `;

    const params = [userId];

    if (status) {
      query += ` AND o.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` GROUP BY o.id
      ORDER BY o.created_at DESC 
      LIMIT $${params.length + 1} 
      OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pgPool.query(query, params);

    return {
      orders: result.rows.map(mapOrderSummaryRow),
      pagination: buildOrdersPagination(result.rows, limit, offset)
    };
  }

  async getRestaurantOrdersByRestaurantId({ restaurantId, status, limit, offset }) {
    if (!restaurantId) {
      return {
        orders: [],
        pagination: { total: 0, limit, offset, hasMore: false }
      };
    }

    let query = `
      SELECT
        o.externalId,
        o.restaurantId,
        o.status,
        o.totalPrice,
        o.total_items,
        o.created_at,
        COUNT(*) OVER() as total_count
      FROM orders o
      WHERE o.restaurantId = $1
    `;

    const params = [restaurantId];

    if (status) {
      query += ` AND o.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` GROUP BY o.id
      ORDER BY o.created_at DESC 
      LIMIT $${params.length + 1} 
      OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pgPool.query(query, params);

    return {
      orders: result.rows.map(mapOrderSummaryRow),
      pagination: buildOrdersPagination(result.rows, limit, offset)
    };
  }

  async updateOrderStatus(client, { orderExternalId, fromStatuses, toStatus }) {
    const statusList = Array.isArray(fromStatuses) ? fromStatuses : [fromStatuses];
    const result = await client.query(
      `UPDATE orders
       SET status = $1
       WHERE externalId = $2 AND status = ANY($3)
       RETURNING id, status`,
      [toStatus, orderExternalId, statusList]
    );

    return result.rows[0] ?? null;
  }

  async updatePaymentStatus(client, { orderId, status, paidAt }) {
    if (paidAt) {
      await client.query(
        `UPDATE payments
         SET status = $1, paid_at = $2
         WHERE orderId = $3`,
        [status, paidAt, orderId]
      );
      return;
    }

    await client.query(
      `UPDATE payments
       SET status = $1
       WHERE orderId = $2`,
      [status, orderId]
    );
  }
}
