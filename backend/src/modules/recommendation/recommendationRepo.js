import neo4jDriver from '../../config/neo4j.js';

export class RecommendationRepository {
  async getRecommendations(userId) {
    const session = neo4jDriver.session();
    try {
      const query = `
        MATCH (u1:User {id: $userId})
        MATCH (u1)-[r1:VIEWED_REVIEW|RATED]->(i:Item)<-[r2:VIEWED_REVIEW|RATED]-(u2:User)
        WHERE u1 <> u2
        WITH u1, u2, 
             sum(
               coalesce(r1.rating, 0) + 
               case when r1.count > 0 then size([x in range(1, r1.count) | x]) * 0.5 else 0 end
             ) AS score1,
             sum(
               coalesce(r2.rating, 0) + 
               case when r2.count > 0 then size([x in range(1, r2.count) | x]) * 0.5 else 0 end
             ) AS score2
        WITH u1, u2, abs(score1 - score2) AS sai_lech
        WHERE sai_lech < 5 
        ORDER BY sai_lech ASC
        LIMIT 10
        MATCH (u2)-[r_new:VIEWED_REVIEW|RATED]->(rec:Item)
        OPTIONAL MATCH (u1)-[already:VIEWED_REVIEW|RATED]->(rec)
        WITH rec, r_new, already,
            (coalesce(r_new.rating, r_new.count * 0.2)) AS base_score
        RETURN rec.id AS itemId, 
              sum(
                CASE 
                  WHEN already IS NOT NULL THEN base_score * 0.3
                  ELSE base_score * 1.2
                END
              ) AS final_score
        ORDER BY final_score DESC
        LIMIT 10
      `;
      const result = await session.run(query, { userId: String(userId) });
      return result.records.map(record => ({
        itemId: record.get('itemId'),
        score: record.get('final_score')
      }));
    } finally {
      await session.close();
    }
  }
}
