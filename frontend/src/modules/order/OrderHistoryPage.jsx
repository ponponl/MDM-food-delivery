import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star, ShoppingCart, ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import styles from './OrderHistoryPage.module.css';
import orderApi from '../../api/orderApi';
import restaurantApi from '../../api/restaurantApi';
import cartApi from '../../api/cartApi';
import { useAuth } from '../../context/AuthContext';
const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.externalId) {
      fetchOrders();
    }
  }, [user?.externalId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const userExternalId = user?.externalId;
      
      if (!userExternalId) {
        toast.error('Vui lòng đăng nhập lại');
        navigate('/auth');
        return;
      }

      // Fetch orders
      const response = await orderApi.getUserOrders(userExternalId, null, 100, 0);
      const data = response?.data;

      if (!data || !Array.isArray(data.orders)) {
        console.log('No orders data');
        setOrders([]);
        return;
      }

      // Get unique restaurant IDs
      const uniqueRestaurantIds = [...new Set(data.orders.map(o => o.restaurantId))];
      
      // Fetch all restaurants in parallel
      const restaurantPromises = uniqueRestaurantIds.map(id =>
        restaurantApi.getById(id).catch(err => {
          console.warn(`Error fetching restaurant ${id}:`, err);
          return null;
        })
      );
      
      const restaurantResponses = await Promise.all(restaurantPromises);
      
      // Build restaurant map
      const restaurantMap = {};
      uniqueRestaurantIds.forEach((id, idx) => {
        const restaurant = restaurantResponses[idx]?.data || restaurantResponses[idx];
        restaurantMap[id] = restaurant;
      });

      // Transform orders with restaurant and item details
      const transformedOrders = data.orders.map(order => {
        const restaurant = restaurantMap[order.restaurantId];
        const menuItems = restaurant?.menu || restaurant?.items || [];
        
        // Create map of menu items by ID
        const menuItemMap = {};
        menuItems.forEach(item => {
          menuItemMap[item._id] = item;
        });

        return {
          orderId: order.orderId,
          orderExternalId: order.orderExternalId,
          restaurantId: order.restaurantId,
          restaurantName: restaurant?.name || `Nhà hàng #${order.restaurantId}`,
          restaurantImage: restaurant?.images?.[0] || null,
          status: order.status,
          statusText: getStatusText(order.status),
          totalPrice: order.totalPrice || 0,
          items: (order.items || []).map(item => {
            const menuItem = menuItemMap[item.itemId];
            return {
              itemId: item.itemId,
              name: menuItem?.name || `Món #${item.itemId}`,
              image: menuItem?.image || menuItem?.images?.[0] || null,
              quantity: item.quantity || 1,
              price: item.price || 0,
              description: menuItem?.description || ''
            };
          }),
          orderDate: formatDate(order.createdAt),
          createdAt: order.createdAt,
          rating: order.rating || null,
          comment: order.comment || ''
        };
      });

      console.log('Transformed Orders with details:', transformedOrders);
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Lỗi tải lịch sử đơn hàng');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'placed': 'Đã đặt',
      'confirmed': 'Xác nhận',
      'preparing': 'Đang chuẩn bị',
      'ready': 'Sẵn sàng',
      'delivering': 'Đang giao',
      'completed': 'Đã hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\//g, '-');
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  const handleReorder = async (order) => {
    try {
      const restaurantName = order.restaurantName || `đơn hàng #${order.orderId}`;
      
      // Add each item from the order to cart
      for (const item of order.items) {
        await cartApi.addItem({
          itemId: item.itemId,
          quantity: item.quantity,
          restaurantPublicId: order.restaurantId,
          options: [],
          note: null
        });
      }
      
      toast.success(`Đã thêm các món từ ${restaurantName} vào giỏ hàng`);
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Lỗi khi thêm vào giỏ hàng. Vui lòng thử lại.');
    }
  };

  const handleViewDetails = (order) => {
    navigate(`/orderDetail`, { state: { orderExternalId: order.orderExternalId } });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'placed': return styles.statusPlaced || '';
      case 'confirmed': return styles.statusConfirmed || '';
      case 'preparing': return styles.statusPreparing || '';
      case 'ready': return styles.statusReady || '';
      case 'delivering': return styles.statusDelivering || '';
      case 'completed': return styles.statusCompleted;
      case 'cancelled': return styles.statusCancelled;
      default: return '';
    }
  };

  const getTotalQuantity = (items) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div className={styles.orderHistoryContainer}>
      <div className={styles.header}>
        <h1>Lịch Sử Đơn Hàng</h1>
        <p>Quản lý và xem chi tiết các đơn hàng của bạn</p>
      </div>

      {/* Status Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${filterStatus === 'all' ? styles.tabActive : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          Tất Cả ({orders.length})
        </button>
        <button
          className={`${styles.tab} ${filterStatus === 'placed' ? styles.tabActive : ''}`}
          onClick={() => setFilterStatus('placed')}
        >
          Đã Đặt ({orders.filter(o => o.status === 'placed').length})
        </button>
        <button
          className={`${styles.tab} ${filterStatus === 'confirmed' ? styles.tabActive : ''}`}
          onClick={() => setFilterStatus('confirmed')}
        >
          Xác Nhận ({orders.filter(o => o.status === 'confirmed').length})
        </button>
        <button
          className={`${styles.tab} ${filterStatus === 'preparing' ? styles.tabActive : ''}`}
          onClick={() => setFilterStatus('preparing')}
        >
          Chuẩn Bị ({orders.filter(o => o.status === 'preparing').length})
        </button>
        <button
          className={`${styles.tab} ${filterStatus === 'ready' ? styles.tabActive : ''}`}
          onClick={() => setFilterStatus('ready')}
        >
          Sẵn Sàng ({orders.filter(o => o.status === 'ready').length})
        </button>
        <button
          className={`${styles.tab} ${filterStatus === 'delivering' ? styles.tabActive : ''}`}
          onClick={() => setFilterStatus('delivering')}
        >
          Đang Giao ({orders.filter(o => o.status === 'delivering').length})
        </button>
        <button
          className={`${styles.tab} ${filterStatus === 'completed' ? styles.tabActive : ''}`}
          onClick={() => setFilterStatus('completed')}
        >
          Hoàn Thành ({orders.filter(o => o.status === 'completed').length})
        </button>
        <button
          className={`${styles.tab} ${filterStatus === 'cancelled' ? styles.tabActive : ''}`}
          onClick={() => setFilterStatus('cancelled')}
        >
          Đã Hủy ({orders.filter(o => o.status === 'cancelled').length})
        </button>
      </div>

      <div className={styles.ordersList}>
        {loading ? (
          <div className={styles.emptyState}>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <ShoppingCart size={48} />
            <p>Không có đơn hàng nào</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.orderId} className={styles.orderCard}>
              {/* Header */}
              <div className={styles.orderHeader}>
                <div className={styles.restaurantInfo}>
                  <div style={{
                    width: 50,
                    height: 50,
                    backgroundColor: '#e0e0e0',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999'
                  }}>
                    {order.restaurantImage ? (
                      <img src={order.restaurantImage} alt={order.restaurantName || 'Restaurant'} style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                    ) : (
                      <ShoppingCart size={24} />
                    )}
                  </div>
                  <div>
                    <h3>{order.restaurantName || `Đơn hàng #${order.orderId}`}</h3>
                    <p className={styles.orderDate}>{order.orderDate}</p>
                  </div>
                </div>
                <div className={`${styles.status} ${getStatusColor(order.status)}`}>
                  {order.statusText}
                </div>
              </div>

              {/* Items Carousel */}
              <div className={styles.itemsSlider}>
                <ItemsCarousel className={styles.sliderMain} items={order.items} totalQuantity={getTotalQuantity(order.items)} />
                <div className={styles.sliderInfo}>
                  <div className={styles.quantityBadge}>
                    {getTotalQuantity(order.items)} món
                  </div>
                  <button
                    className={styles.btnViewOrder}
                    onClick={() => handleViewDetails(order)}
                  >
                    Xem chi tiết <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Total Price */}
              <div className={styles.totalPrice}>
                <span>Tổng tiền:</span>
                <span className={styles.price}>{order.totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                {order.status === 'completed' && (
                  <>
                    {order.rating ? (
                      <div className={styles.ratingDisplay}>
                        <span>Đánh giá: </span>
                        {[...Array(order.rating)].map((_, i) => (
                          <Star key={i} size={14} fill="gold" color="gold" />
                        ))}
                      </div>
                    ) : (
                      <button
                        className={styles.btnRate}
                        onClick={() => navigate(`/order/${order.orderExternalId || order.orderId}/review`)}
                      >
                        Đánh giá
                      </button>
                    )}
                  </>
                )}

                <button
                  className={styles.btnReorder}
                  onClick={() => handleReorder(order)}
                >
                  <ShoppingCart size={16} />
                  Mua lại
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

const ItemsCarousel = ({ items, totalQuantity }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!items || items.length === 0) {
    return (
      <div className={styles.carousel}>
        <div className={styles.carouselContent}>
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999'
          }}>
            <ShoppingCart size={24} />
          </div>
          <div className={styles.carouselInfo}>
            <p className={styles.carouselName}>Không có món ăn</p>
          </div>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex] || {};

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <div className={styles.carousel}>
      {items.length > 1 && (
        <button className={styles.carouselBtn} onClick={prevSlide}>
          <ChevronLeft size={20} />
        </button>
      )}

      <div className={styles.carouselContent}>
        {currentItem.image ? (
          <img src={currentItem.image} alt={currentItem.name || 'Item'} />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999'
          }}>
            <ShoppingCart size={24} />
          </div>
        )}
        <div className={styles.carouselInfo}>
          <p className={styles.carouselName}>{currentItem.name || 'Món ăn'}</p>
          <div className={styles.carouselMeta}>
            <span>x{currentItem.quantity || 1}</span>
            <span className={styles.dots}>
              {items.map((_, idx) => (
                <span
                  key={idx}
                  className={`${styles.dot} ${idx === currentIndex ? styles.dotActive : ''}`}
                />
              ))}
            </span>
          </div>
        </div>
      </div>

      {items.length > 1 && (
        <button className={styles.carouselBtn} onClick={nextSlide}>
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
};

export default OrderHistoryPage;
