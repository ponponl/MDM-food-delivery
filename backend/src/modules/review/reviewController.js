import { reviewService } from './reviewService.js';

export const getReviewsByItemId = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }

    const reviews = await reviewService.getReviewsByItemId(itemId);
    
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

    const reviews = await reviewService.getReviewsByRestaurantId(restaurantId);
    
    return res.status(200).json({
      status: 'success',
      data: reviews
    });
  } catch (error) {
    console.error('Error in getReviewsByRestaurantId:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
