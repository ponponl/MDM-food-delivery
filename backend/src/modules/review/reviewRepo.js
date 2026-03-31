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
}
