import { ReviewRepository } from '../repositories/reviewRepo.js';
import { getRestaurantByPublicId } from '../services/restaurantService.js';

const reviewRepo = new ReviewRepository();

export const getReviewsByItemId = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }

    const reviews = await reviewRepo.findReviewsByItemId(itemId);
    
    return res.status(200).json({
      status: 'success',
      data: reviews
    });
  } catch (error) {
    console.error('Error in getReviewsByItemId:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getReviewsByRestaurantId = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'restaurantId is required' });
    }

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

    const reviews = await reviewRepo.findReviewsByRestaurantId(resolvedId);
    
    return res.status(200).json({
      status: 'success',
      data: reviews
    });
  } catch (error) {
    console.error('Error in getReviewsByRestaurantId:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
