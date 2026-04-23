import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import recommendationApi from '../../api/recommendationApi';
import { useAuth } from '../../context/AuthContext';
import styles from './RecommendationPage.module.css';
import { AlertCircle, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

const RecommendationPage = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await recommendationApi.getRecommendations();
        const data = response?.data || response || [];
        setRecommendations(data);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Không thể tải dữ liệu gợi ý. Vui lòng thử lại sau.');
        toast.error('Có lỗi xảy ra khi tải danh sách gợi ý');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  const handleItemClick = (item) => {
    navigate(`/food/${item.itemId}`, { state: { foodItem: { _id: item.itemId, ...item } } });
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <AlertCircle size={48} className={styles.emptyIcon} />
          <h2>Vui lòng đăng nhập</h2>
          <p>Bạn cần đăng nhập để xem các món ăn được gợi ý dành riêng cho bạn.</p>
          <button className={styles.actionButton} onClick={() => navigate('/auth')}>
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Gợi ý dành riêng cho bạn</h1>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Đang phân tích sở thích của bạn...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <h2>Đã có lỗi xảy ra</h2>
          <p>{error}</p>
          <button className={styles.actionButton} onClick={() => window.location.reload()}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          < ShoppingBag size={48} className={styles.emptyIcon} />
          <h2>Chưa có đủ dữ liệu gợi ý</h2>
          <p>Hãy xem và đánh giá thêm nhiều món ăn để hệ thống có thể gợi ý chính xác hơn cho bạn nhé.</p>
          <button className={styles.actionButton} onClick={() => navigate('/')}>
            Khám phá món ăn
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Gợi ý dành riêng cho bạn</h1>
      <p className={styles.subtitle}>Dựa trên những món ăn bạn đã xem và đánh giá</p>
      
      <div className={styles.grid}>
        {recommendations.map((rec) => {
          const item = rec.item;
          if (!item) return null;
          
          const imageUrl = item.images?.[0] || 'https://via.placeholder.com/300x200?text=Foodly';
          
          return (
            <div key={item.itemId} className={styles.card} onClick={() => handleItemClick(item)}>
              <div className={styles.imageContainer}>
                <img src={imageUrl} alt={item.name} className={styles.image} />
              </div>
              <div className={styles.content}>
                <h3 className={styles.itemName}>{item.name}</h3>
                <p className={styles.restaurantName}>{item.restaurantName || 'Nhà hàng Foodly'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationPage;