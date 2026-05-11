import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ChevronLeft, Send, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './OrderReviewPage.module.css';
import orderApi from '../../../api/orderApi';
import reviewApi from '../../../api/reviewApi';
import restaurantApi from '../../../api/restaurantApi';
import { useAuth } from '../../../context/AuthContext';

const OrderReviewPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [itemReviews, setItemReviews] = useState({});
  const [restaurantReview, setRestaurantReview] = useState({ rating: 0, comment: '' });

  const [hoveredRestaurantStars, setHoveredRestaurantStars] = useState(0);
  const [hoveredItemStars, setHoveredItemStars] = useState({});

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const response = await orderApi.getOrderDetail(orderId);
        if (response?.data) {
          const order = response.data;
          
          try {
            const restRes = await restaurantApi.getById(order.restaurantId);
            const restaurant = restRes?.data || restRes;
            const menuItems = restaurant?.menu || restaurant?.items || [];

            order.restaurantInfo = {
              name: restaurant?.name || order.restaurantName || 'Nhà hàng',
              image:
                (Array.isArray(restaurant?.images) && restaurant.images[0]) ||
                order.restaurantImageUrl ||
                null
            };
            
            const menuItemMap = {};
            menuItems.forEach(item => {
              const key = item?.itemId || item?._id || item?.id;
              if (key) {
                menuItemMap[String(key)] = item;
              }
            });
            
            order.items = (order.items || []).map(item => {
              const key = item?.itemId || item?.id || item?._id;
              const menuItem = key ? menuItemMap[String(key)] : null;
              return {
                ...item,
                name: menuItem?.name || item.itemName || item.name || `Món ăn (Mã: ${item.itemId})`,
                image:
                  menuItem?.image ||
                  menuItem?.images?.[0] ||
                  item.itemImageUrl ||
                  item.image ||
                  null,
              };
            });
          } catch (err) {
             console.warn('Lỗi lấy thông tin nhà hàng', err);
             order.restaurantInfo = {
               name: order.restaurantName || 'Nhà hàng',
               image: order.restaurantImageUrl || null
             };
          }
          
          setOrderData(order);
          
          const initialItems = {};
          const items = order.items || []; 
          items.forEach(item => {
            initialItems[item.itemId] = { rating: 0, comment: '' };
          });
          setItemReviews(initialItems);
        }
      } catch (error) {
        toast.error('Không thể tải thông tin đơn hàng');
        console.error('Error fetching order mapping:', error);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  const handleRestaurantRating = (rating) => {
    setRestaurantReview(prev => ({ ...prev, rating }));
  };

  const handleItemRating = (itemId, rating) => {
    setItemReviews(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], rating }
    }));
  };

  const handleItemComment = (itemId, comment) => {
    setItemReviews(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], comment }
    }));
  };

  const validateForm = () => {
    if (restaurantReview.rating === 0) {
      toast.error('Vui lòng xếp hạng nhà hàng!');
      return false;
    }

    const unratedItem = Object.values(itemReviews).find(item => item.rating === 0);
    if (unratedItem) {
      toast.error('Vui lòng xếp hạng tất cả các món ăn!');
      return false;
    }

    if (!user) {
      toast.error('Vui lòng đăng nhập để đánh giá!');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        orderExternalId: orderData.orderExternalId || orderId,
        restaurantReview: {
          rating: restaurantReview.rating,
          comment: restaurantReview.comment
        },
        itemReviews: Object.entries(itemReviews).map(([itemId, data]) => ({
          itemId: itemId,
          rating: data.rating,
          comment: data.comment
        }))
      };

      await reviewApi.createReviews(payload);
      toast.success('Đánh giá của bạn đã được gửi thành công!');
      navigate('/orderHistory'); 
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra khi gửi đánh giá');
    }
  };

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.spinner}></div>
      <span>Đang tải thông tin đơn hàng...</span>
    </div>
  );
  if (!orderData) return <div className={styles.loading}>Không tìm thấy thông tin đơn hàng.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/orderHistory')}>
          <ChevronLeft size={24} />
        </button>
        <h1>Đánh giá đơn hàng</h1>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Món ăn đã đặt</h2>
        {orderData.items?.map((item) => (
          <div key={item.itemId} className={styles.itemCard}>
            <div className={styles.itemInfo}>
              <div className={styles.itemImage}>
                {item.image ? (
                   <img src={item.image} alt={item.name} />
                ) : (
                   <span style={{display: 'flex', width:'100%', height:'100%', alignItems: 'center', justifyContent:'center', color:'#aaa'}}>
                     <ImageIcon size={24} />
                   </span>
                )}
              </div>
              <div className={styles.itemDetails}>
                <div className={styles.itemName}>{item.name || `Món ăn (Mã: ${item.itemId})`}</div>
                {item.quantity && <div className={styles.itemDesc}>Số lượng: {item.quantity}</div>}
              </div>
            </div>

            <div className={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = (hoveredItemStars[item.itemId] || itemReviews[item.itemId]?.rating) >= star;
                return (
                  <Star
                    key={star}
                    className={`${styles.star} ${isActive ? styles.active : ''}`}
                    onClick={() => handleItemRating(item.itemId, star)}
                    onMouseEnter={() => setHoveredItemStars(prev => ({ ...prev, [item.itemId]: star }))}
                    onMouseLeave={() => setHoveredItemStars(prev => ({ ...prev, [item.itemId]: 0 }))}
                    size={28}
                  />
                );
              })}
            </div>

            <div className={styles.textareaBox}>
              <textarea
                className={styles.textarea}
                placeholder="Bạn thấy món này thế nào? (Không bắt buộc)"
                value={itemReviews[item.itemId]?.comment || ''}
                onChange={(e) => handleItemComment(item.itemId, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Nhà hàng</h2>
        <div className={styles.restaurantInfoRow}>
          <div className={styles.restaurantImage}>
            {orderData.restaurantInfo?.image ? (
              <img
                src={orderData.restaurantInfo.image}
                alt={orderData.restaurantInfo.name}
              />
            ) : (
              <span
                style={{
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#aaa'
                }}
              >
                <ImageIcon size={24} />
              </span>
            )}
          </div>
          <div className={styles.restaurantMeta}>
            <div className={styles.restaurantName}>
              {orderData.restaurantInfo?.name || 'Nhà hàng'}
            </div>
          </div>
        </div>
        <div className={styles.ratingContainer} style={{ marginBottom: 15 }}>
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = (hoveredRestaurantStars || restaurantReview.rating) >= star;
            return (
              <Star
                key={star}
                className={`${styles.star} ${isActive ? styles.active : ''}`}
                onClick={() => handleRestaurantRating(star)}
                onMouseEnter={() => setHoveredRestaurantStars(star)}
                onMouseLeave={() => setHoveredRestaurantStars(0)}
                size={32}
              />
            );
          })}
        </div>
        <div className={styles.textareaBox}>
          <textarea
            className={styles.textarea}
            placeholder="Chia sẻ trải nghiệm của bạn về nhà hàng... (Không bắt buộc)"
            value={restaurantReview.comment}
            onChange={(e) => setRestaurantReview({ ...restaurantReview, comment: e.target.value })}
          />
        </div>
      </div>

      <button className={styles.submitBtn} onClick={handleSubmit}>
        <Send size={18} /> Gửi đánh giá
      </button>
    </div>
  );
};

export default OrderReviewPage;
