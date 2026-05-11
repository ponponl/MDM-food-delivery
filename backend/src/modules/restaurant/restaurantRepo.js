import Restaurant from './restaurantModel.js'
import Menu from '../menu/menuModel.js';

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
        return await query;
    }

    async findById(restaurantId, { includeMenu = false } = {}) {
        if (!restaurantId) {
            return null;
        }

        return await Restaurant.findById(restaurantId);
    }

    async findByPublicIds(publicIds = [], { includeMenu = false } = {}) {
        const ids = Array.isArray(publicIds)
            ? publicIds.filter(Boolean)
            : [];

        if (ids.length === 0) {
            return [];
        }

        return await Restaurant.find({ publicId: { $in: ids } }).lean();
    }

    async search(query, limit = 20) {
        if (!query || !query.trim()) {
            return [];
        }

        const searchRegex = new RegExp(escapeRegex(query.trim()), 'i');

        const baseMatches = await Restaurant.find(
            {
                $or: [
                    { name: searchRegex },
                    { type: searchRegex }
                ]
            }
        );

        const menuRestaurantIds = await Menu.distinct('restaurantId', {
            restaurantId: { $ne: null },
            $or: [
                { name: searchRegex },
                { category: searchRegex }
            ]
        });

        const menuMatches = menuRestaurantIds.length > 0
            ? await Restaurant.find({ _id: { $in: menuRestaurantIds } })
            : [];

        const merged = new Map();
        [...baseMatches, ...menuMatches].forEach((item) => {
            if (!item?._id) return;
            merged.set(String(item._id), item);
        });

        return Array.from(merged.values()).slice(0, limit);
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

    async updateInfo(publicId, updateData) {
        return await Restaurant.findOneAndUpdate(
            { publicId },
            { $set: updateData },
            { new: true, runValidators: true }
        );
    }
}