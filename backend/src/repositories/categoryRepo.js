import Category from '../models/categoryModel.js';

export class CategoryRepository {
    async findAll() {
        return await Category.find()
            .select('-_id')
            .sort({ order: 1, label: 1 });
    }
}
