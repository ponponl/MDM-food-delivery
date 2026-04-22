import { ReviewRepository } from './reviewRepo.js';
import { getRestaurantByPublicId } from '../restaurant/restaurantService.js';

const reviewRepo = new ReviewRepository();

class ReviewService {
  constructor() {
    this.reviewRepo = new ReviewRepository();
  }

  async getReviewsByItemId(itemId) {
    return await this.reviewRepo.findReviewsByItemId(itemId);
  }

  async getReviewsByRestaurantId(restaurantId) {
    let resolvedId = restaurantId;

    if (!/^[a-fA-F0-9]{24}$/.test(restaurantId)) {
      try {
        const restaurant = await getRestaurantByPublicId(restaurantId);
        if (restaurant && restaurant._id) {
          resolvedId = restaurant._id.toString();
        }
      } catch (err) {
        console.warn('Could not resolve publicId to _id', err.message);
      }
    }

    return await this.reviewRepo.findReviewsByRestaurantId(resolvedId);
  }

async createFullReview(userId, payload) {
    const { orderId, orderExternalId, restaurantReview, itemReviews } = payload;
    const resolvedOrderId = orderId || orderExternalId;

    if (!resolvedOrderId) {
      throw new Error('Thiếu mã đơn hàng.');
    }

    const order = await reviewRepo.findOrderById(resolvedOrderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng.');

    if (String(order.userid) !== String(userId)) {
      throw new Error('Bạn không có quyền đánh giá đơn hàng này.');
    }

    if (order.status !== 'completed') {
      throw new Error('Chỉ đơn hàng đã hoàn thành mới có thể đánh giá.');
    }

    if (!order.completed_at) {
      throw new Error('Dữ liệu đơn hàng thiếu thời gian hoàn thành.');
    }

    const completedTime = new Date(order.completed_at).getTime();
    const currentTime = new Date().getTime();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    if (currentTime - completedTime > sevenDaysInMs) {
      throw new Error('Đã quá thời hạn 7 ngày để thực hiện đánh giá.');
    }

    return await reviewRepo.createReviewTransaction(
      order.id, 
      order.restaurantid, 
      itemReviews, 
      restaurantReview
    );
  }
}

export const reviewService = new ReviewService();
