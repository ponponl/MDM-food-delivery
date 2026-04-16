import Restaurant from './restaurantModel.js'

export const CATEGORY_MAP = {
    'burger': 'Burger',
    'pizza': 'Pizza',
    'com': 'Cơm',
    'mi-pho': 'Mì & Phở',
    'banh-mi': 'Bánh Mì',
    'ca-phe': 'Cà Phê',
    'tra-sua': 'Trà Sữa',
    'nuoc-ep': 'Nước Ép',
    'banh-ngot': 'Bánh Ngọt'
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildCategoryRegex = (category) => {
    if (!category) {
        return null;
    }

    const raw = category.toString().trim();
    if (!raw) {
        return null;
    }

    const mapped = CATEGORY_MAP[raw.toLowerCase()] ?? raw;
    return new RegExp(escapeRegex(mapped), 'i');
};

const buildNameRegex = (name) => {
    if (!name) {
        return null;
    }

    const raw = name.toString().trim();
    if (!raw) {
        return null;
    }

    return new RegExp(escapeRegex(raw), 'i');
};

export class RestaurantRepository {
    async findAll(limit) {
        const query = Restaurant.find();
        if (Number.isInteger(limit) && limit > 0) {
            query.limit(limit);
        }
        return await query;
    }

    async findByFilters({ name, category } = {}) {
        const nameRegex = buildNameRegex(name);
        const categoryRegex = buildCategoryRegex(category);

        const query = {};

        if (nameRegex) {
            query.name = nameRegex;
        }

        if (categoryRegex) {
            query.type = categoryRegex;
        }

        return await Restaurant.find(query);
    }

    async findByCategoryLimited(category, limit = 5) {
        const categoryRegex = buildCategoryRegex(category);
        if (!categoryRegex) {
            return [];
        }

        const query = { type: categoryRegex };

        return await Restaurant.find(query).limit(limit);
    }

    async findByPublicId(publicId, { includeMenu = true } = {}) {
        const query = Restaurant.findOne({ publicId });

        if (!includeMenu) {
            query.select('-menu');
        }

        return await query;
    }

    async search(query, limit = 20) {
        if (!query || !query.trim()) {
            return [];
        }

        const searchRegex = new RegExp(escapeRegex(query.trim()), 'i');

        return await Restaurant.find(
            {
                $or: [
                    { name: searchRegex },
                    { type: searchRegex },
                    { 'menu.name': searchRegex },
                    { 'menu.category': searchRegex }
                ]
            }
        ).limit(limit);
    }

    async findNearest(lng, lat, maxDistance = 5000) { // maxDistance tính bằng mét (ví dụ 10km)
        return await Restaurant.find({
            "address.location": {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat] // [kinh độ, vĩ độ]
                    },
                    $maxDistance: maxDistance
                }
            }
        });
    }
}