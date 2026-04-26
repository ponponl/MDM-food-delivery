export class ShipperRepository {
  async getRandomAvailableDriver(clientOrPool) {
    const query = `
      SELECT driverid, fullname, phone, status 
      FROM shippers 
      WHERE status = 'available' 
      ORDER BY RANDOM() 
      LIMIT 1
    `;
    const result = await clientOrPool.query(query);
    return result.rows[0] || null;
  }

  async updateStatus(clientOrPool, shipperId, status) {
    const query = `
      UPDATE shippers 
      SET status = $1 
      WHERE driverid = $2 
      RETURNING *
    `;
    const result = await clientOrPool.query(query, [status, shipperId]);
    return result.rows[0] || null;
  }

  async findById(clientOrPool, shipperId) {
    const query = `SELECT * FROM shippers WHERE driverid = $1`;
    const result = await clientOrPool.query(query, [shipperId]);
    return result.rows[0] || null;
  }
}