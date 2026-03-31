import Category from './categoryModel.js';

export class CategoryRepository {
    async findAll() {
        return await Category.find()
            .select('-_id')
            .sort({ order: 1, label: 1 });
    }
}
