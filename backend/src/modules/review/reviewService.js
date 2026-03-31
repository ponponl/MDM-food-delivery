import { ReviewRepository } from './reviewRepo.js';
import { getRestaurantByPublicId } from '../restaurant/restaurantService.js';

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
}

export const reviewService = new ReviewService();
