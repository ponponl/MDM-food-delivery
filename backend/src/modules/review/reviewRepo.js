import pgPool from '../../config/postgres.js';

export class ReviewRepository {
  async findReviewsByItemId(itemId) {
    const query = `
      SELECT rating, comment, created_at 
      FROM item_reviews
      WHERE itemid = $1
    `;
    const result = await pgPool.query(query, [itemId]);
    return result.rows;
  }

  async findReviewsByRestaurantId(restaurantId) {
    const query = `
      SELECT rating, comment, created_at 
      FROM restaurant_reviews
      WHERE restaurantid = $1
    `;
    const result = await pgPool.query(query, [restaurantId]);
    return result.rows;
  }
  
async findOrderById(orderId) {
  const query = `
    SELECT id, userid, restaurantid, status, completed_at
    FROM orders
    WHERE 
      (CASE 
        WHEN $1 ~ '^[0-9]+$' THEN id = $1::bigint 
        ELSE FALSE 
      END)
      OR 
      (CASE 
        WHEN $1 ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' 
        THEN externalid = $1::uuid 
        ELSE FALSE 
      END)
  `;
  
  const result = await pgPool.query(query, [String(orderId)]);
  return result.rows[0];
}

async createReviewTransaction(orderId, restaurantId, itemReviews, restaurantReview) {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    if (restaurantReview) {
      await client.query(
        `INSERT INTO restaurant_reviews (orderid, restaurantid, rating, comment, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [orderId, restaurantId, restaurantReview.rating, restaurantReview.comment]
      );
    }

    if (itemReviews && itemReviews.length > 0) {
      for (const item of itemReviews) {
        await client.query(
          `INSERT INTO item_reviews (orderid, itemid, rating, comment, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [orderId, item.itemId, item.rating, item.comment]
        );
      }
    }

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      throw new Error('Bạn đã đánh giá đơn hàng này rồi.');
    }
    throw error;
  } finally {
    client.release();
  }
}
}
