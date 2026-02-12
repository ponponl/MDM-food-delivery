import React, { useState, useEffect } from 'react';
import testAPI from '../api/testAPI';

const SystemTest = () => {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchStatus = async () => {
        try {
          const data = await testAPI.getSystemStatus();
          setTest(data);
        } catch (error) {
          console.error("Lỗi kết nối Backend:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchStatus();
    }, []);

  if (loading) return <p>Đang kiểm tra hệ thống...</p>;
  if (!test) return <p style={{color: 'red'}}>Không thể kết nối tới Backend</p>;

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
      <h2>Trạng thái hệ thống Đồ án</h2>
      <p>Server: {test.server}</p>
      <hr />
      <ul>
        <li><strong>MongoDB:</strong> {test.databases.mongodb}</li>
        <li><strong>PostgreSQL:</strong> {test.databases.postgres}</li>
        <li><strong>Redis:</strong> {test.databases.redis}</li>
        <li><strong>Neo4j:</strong> {test.databases.neo4j}</li>
      </ul>
    </div>
  );
};

export default SystemTest;