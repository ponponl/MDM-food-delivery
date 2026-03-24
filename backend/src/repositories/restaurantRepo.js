import Restaurant from '../models/restaurantModel.js'

const CATEGORY_MAP = {
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
    async findAll() {
        return await Restaurant.find();
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

    async findById(id) {
        return await Restaurant.findById(id);
    }
}