import { RecommendationRepository } from './recommendationRepo.js';

class RecommendationService {
  constructor() {
    this.repo = new RecommendationRepository();
  }

  async getRecommendations(userId) {
    if (!userId) throw new Error("userId is required");
    return await this.repo.getRecommendations(String(userId));
  }
}

export const recommendationService = new RecommendationService();
