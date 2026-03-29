import { CategoryRepository } from './categoryRepo.js';

const repo = new CategoryRepository();

export const getAllCategories = async () => {
    const categories = await repo.findAll();
    return categories;
};
