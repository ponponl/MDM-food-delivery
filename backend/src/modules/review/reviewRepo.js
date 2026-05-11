import mongoose from 'mongoose';
import pgPool from '../../config/postgres.js';
import neo4jDriver from '../../config/neo4j.js';
import Review from './reviewModel.js';

const normalizeReview = (review) => {
  if (!review) return null;
  return {
    rating: review.rating,
    comment: review.comment,
    created_at: review.createdAt,
    imageUrls: review.imageUrls || [],
    user_id: review.userId,
    user_name: review.userName,
    restaurantId: review.restaurantId,
    menuId: review.menuId,
    targetType: review.targetType
  };
};

export class ReviewRepository {
  async findReviewsByItemId(itemId) {
    const itemObjectId = mongoose.Types.ObjectId.isValid(itemId)
      ? new mongoose.Types.ObjectId(itemId)
      : null;
    if (!itemObjectId) return [];

    const reviews = await Review.find({
      targetType: 'menu',
      menuId: itemObjectId
    })
      .sort({ createdAt: -1 })
      .lean();

    return (reviews || []).map(normalizeReview).filter(Boolean);
  }

  async findReviewsByRestaurantId(restaurantId) {
    const restaurantObjectId = mongoose.Types.ObjectId.isValid(restaurantId)
      ? new mongoose.Types.ObjectId(restaurantId)
      : null;
    if (!restaurantObjectId) return [];

    const reviews = await Review.find({
      targetType: 'restaurant',
      restaurantId: restaurantObjectId
    })
      .sort({ createdAt: -1 })
      .lean();

    return (reviews || []).map(normalizeReview).filter(Boolean);
  }

  async trackItemView(userId, itemId) {
    const session = neo4jDriver.session();
    try {
      const query = `
        MERGE (u:User {id: $userId})
        MERGE (i:Item {id: $itemId})
        MERGE (u)-[r:VIEWED_REVIEW]->(i) 
        ON CREATE SET 
            r.count = 1, 
            r.lastViewedAt = datetime()
        ON MATCH SET 
            r.count = coalesce(r.count, 0) + 1, 
            r.lastViewedAt = datetime()
      `;
      await session.run(query, { userId, itemId });
    } finally {
      await session.close();
    }
  }

  async trackItemRatings(userId, itemReviews) {
    if (!itemReviews || itemReviews.length === 0) return;
    const session = neo4jDriver.session();
    try {
      const query = `
        MERGE (u:User {id: $userId})
        MERGE (i:Item {id: $itemId})
        MERGE (u)-[r:RATED]->(i) 
        SET r.rating = toInteger($rating), 
            r.timestamp = datetime()
      `;
      for (const item of itemReviews) {
        if (item.rating > 0) {
          await session.run(query, { 
            userId: String(userId), 
            itemId: String(item.itemId), 
            rating: item.rating 
          });
        }
      }
    } catch(err) {
      console.error("Neo4j rating tracking error:", err);
    } finally {
      await session.close();
    }
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

  async hasReviewForOrder(orderId, userId) {
    if (!orderId || !userId) return false;
    const existing = await Review.findOne({
      orderId: String(orderId),
      userId: String(userId)
    })
      .select({ _id: 1 })
      .lean();
    return Boolean(existing);
  }

  async createReviews({
    userId,
    orderId,
    restaurantId,
    itemReviews,
    restaurantReview
  }) {
    const docs = [];

    const restaurantRating = Number(restaurantReview?.rating);
    if (Number.isFinite(restaurantRating)) {
      docs.push({
        userId: String(userId),
        targetType: 'restaurant',
        restaurantId,
        menuId: null,
        orderId: String(orderId),
        rating: restaurantRating,
        comment: restaurantReview.comment || '',
        imageUrls: restaurantReview.imageUrls || [],
        createdAt: new Date()
      });
    }

    if (Array.isArray(itemReviews) && itemReviews.length > 0) {
      for (const item of itemReviews) {
        if (!item?.itemId) continue;
        if (!mongoose.Types.ObjectId.isValid(item.itemId)) continue;
        const itemRating = Number(item.rating);
        if (!Number.isFinite(itemRating)) continue;

        docs.push({
          userId: String(userId),
          targetType: 'menu',
          restaurantId,
          menuId: new mongoose.Types.ObjectId(item.itemId),
          orderId: String(orderId),
          rating: itemRating,
          comment: item.comment || '',
          imageUrls: item.imageUrls || [],
          createdAt: new Date()
        });
      }
    }

    if (docs.length === 0) return [];
    return await Review.insertMany(docs);
  }
}
