import { recommendationService } from './recommendationService.js';
import * as menuService from '../menu/menu.service.js';

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const recommendations = await recommendationService.getRecommendations(userId);
    
    const itemIds = recommendations.map(rec => rec.itemId);
    const itemsMap = await menuService.getMenuItems(itemIds);
    
    const detailedRecommendations = recommendations.map(rec => ({
      ...rec,
      item: itemsMap[rec.itemId] && itemsMap[rec.itemId].name && itemsMap[rec.itemId].name !== `Item ${rec.itemId}` ? itemsMap[rec.itemId] : null
    })).filter(rec => rec.item != null);
    
    return res.status(200).json({
      status: 'success',
      data: detailedRecommendations
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
