import {RestaurantRepository} from '../restaurant/restaurantRepo.js';

const repo = new RestaurantRepository();

export const getGlobalSearch = async (q, limit = 20) => {
    if (!q || !q.trim()) {
        return [];
    }

    const query = q.trim().toLowerCase();
    const rawResults = await repo.search(query, limit);

    return rawResults.map((restaurant) => {
        const restaurantDoc = restaurant.toObject ? restaurant.toObject() : restaurant;
        
        const isRestaurantMatch = restaurantDoc.name.toLowerCase().includes(query);
        const isTypeMatch = restaurantDoc.type?.toLowerCase().includes(query);
        
        const matchedFoods = (restaurantDoc.menu || []).filter((food) => (
            food.name?.toLowerCase().includes(query) ||
            food.category?.toLowerCase().includes(query)
        ));

        return {
            publicId: restaurantDoc.publicId,
            restaurantName: restaurantDoc.name,
            restaurantType: restaurantDoc.type,
            isRestaurantMatch,
            isTypeMatch,
            matchedFoodsCount: matchedFoods.length,
            matchedFoods: matchedFoods.slice(0, 5), // Limit to top 5 matched foods
            restaurantImage: restaurantDoc.images?.[0],
            restaurantAddress: restaurantDoc.address?.full
        };
    }).sort((a, b) => {
        // Sort results: restaurants matching name first, then by matched foods count
        if (a.isRestaurantMatch !== b.isRestaurantMatch) {
            return a.isRestaurantMatch ? -1 : 1;
        }
        return b.matchedFoodsCount - a.matchedFoodsCount;
    });
}