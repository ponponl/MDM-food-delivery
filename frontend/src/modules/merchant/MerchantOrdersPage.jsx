import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import styles from '../order/OrderHistoryPage.module.css';
import orderApi from '../../api/orderApi';
import { useAuth } from '../../context/AuthContext';

const MerchantOrdersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingMap, setUpdatingMap] = useState({});

  useEffect(() => {
    if (user?.restaurantInfo) {
      fetchOrders();
    }
  }, [user?.restaurantInfo]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const restaurantInfo = user?.restaurantInfo || {};
      const restaurantId =
        restaurantInfo.publicId ||
        restaurantInfo.restaurantId ||
        restaurantInfo.id ||
        null;

      if (!restaurantId) {
        toast.error('Không tìm thấy thông tin nhà hàng');
        return;
      }

      const response = await orderApi.getRestaurantOrders(restaurantId, null, 100, 0);
      const data = response?.data;

      if (!data || !Array.isArray(data.orders)) {
        setOrders([]);
        return;
      }

      const menuItems = restaurantInfo?.menu || restaurantInfo?.items || [];
      const menuItemMap = {};
      menuItems.forEach((item) => {
        menuItemMap[item._id] = item;
      });

      const transformedOrders = data.orders.map((order) => ({
        orderId: order.orderId,
        orderExternalId: order.orderExternalId,
        restaurantId: order.restaurantId,
        restaurantName: restaurantInfo?.name || `Nhà hàng #${order.restaurantId}`,
        restaurantImage: restaurantInfo?.images?.[0] || null,
        status: order.status,
        statusText: getStatusText(order.status),
        totalPrice: order.totalPrice || 0,
        items: (order.items || []).map((item) => {
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
        createdAt: order.createdAt
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching restaurant orders:', error);
      toast.error('Lỗi tải danh sách đơn hàng');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      placed: 'Đã đặt',
      confirmed: 'Xác nhận',
      delivering: 'Đang giao',
      completed: 'Đã hoàn thành',
      cancelled: 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getNextStatus = (status) => {
    switch (status) {
      case 'placed':
        return 'confirmed';
      case 'confirmed':
        return 'delivering';
      case 'delivering':
        return 'completed';
      default:
        return null;
    }
  };

  const getNextStatusLabel = (nextStatus) => {
    const labelMap = {
      confirmed: 'Xác nhận',
      delivering: 'Bắt đầu giao',
      completed: 'Hoàn thành'
    };
    return labelMap[nextStatus] || 'Cập nhật';
  };

  const updateOrderStatus = async (order) => {
    const nextStatus = getNextStatus(order.status);
    if (!nextStatus) return;

    setUpdatingMap((prev) => ({ ...prev, [order.orderExternalId]: true }));

    try {
      if (nextStatus === 'confirmed') {
        await orderApi.confirmOrder(order.orderExternalId);
      }
      if (nextStatus === 'delivering') {
        await orderApi.startDelivery(order.orderExternalId);
      }
      if (nextStatus === 'completed') {
        await orderApi.completeOrder(order.orderExternalId);
      }

      setOrders((prev) =>
        prev.map((item) =>
          item.orderExternalId === order.orderExternalId
            ? { ...item, status: nextStatus, statusText: getStatusText(nextStatus) }
            : item
        )
      );

      toast.success(`Đã cập nhật trạng thái sang ${getStatusText(nextStatus)}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Lỗi cập nhật trạng thái đơn hàng');
    } finally {
      setUpdatingMap((prev) => ({ ...prev, [order.orderExternalId]: false }));
    }
  };

  const cancelOrder = async (order) => {
    setUpdatingMap((prev) => ({ ...prev, [order.orderExternalId]: true }));

    try {
      await orderApi.cancelOrder(order.orderExternalId, {
        reason: 'Merchant cancelled',
        cancelledBy: 'merchant'
      });

      setOrders((prev) =>
        prev.map((item) =>
          item.orderExternalId === order.orderExternalId
            ? { ...item, status: 'cancelled', statusText: getStatusText('cancelled') }
            : item
        )
      );

      toast.success('Đã hủy đơn hàng');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Lỗi khi hủy đơn hàng');
    } finally {
      setUpdatingMap((prev) => ({ ...prev, [order.orderExternalId]: false }));
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed':
        return styles.statusPlaced || '';
      case 'confirmed':
        return styles.statusConfirmed || '';
      case 'delivering':
        return styles.statusDelivering || '';
      case 'completed':
        return styles.statusCompleted || '';
      case 'cancelled':
        return styles.statusCancelled || '';
      default:
        return '';
    }
  };

  const getTotalQuantity = (items) => items.reduce((sum, item) => sum + item.quantity, 0);

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter((order) => order.status === filterStatus);

  return (
    <div className={styles.orderHistoryContainer}>
      <div className={styles.header}>
        <h1>Quản Lý Đơn Hàng</h1>
      </div>

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
          Đã Đặt ({orders.filter((o) => o.status === 'placed').length})
        </button>
        <button
          className={`${styles.tab} ${filterStatus === 'confirmed' ? styles.tabActive : ''}`}
          onClick={() => setFilterStatus('confirmed')}
        >
          Xác Nhận ({orders.filter((o) => o.status === 'confirmed').length})
        </button>
        <button
          className={`${styles.tab} ${filterStatus === 'delivering' ? styles.tabActive : ''}`}
          onClick={() => setFilterStatus('delivering')}
        >
          Đang Giao ({orders.filter((o) => o.status === 'delivering').length})
        </button>
        <button
          className={`${styles.tab} ${filterStatus === 'completed' ? styles.tabActive : ''}`}
          onClick={() => setFilterStatus('completed')}
        >
          Hoàn Thành ({orders.filter((o) => o.status === 'completed').length})
        </button>
        <button
          className={`${styles.tab} ${filterStatus === 'cancelled' ? styles.tabActive : ''}`}
          onClick={() => setFilterStatus('cancelled')}
        >
          Đã Hủy ({orders.filter((o) => o.status === 'cancelled').length})
        </button>
      </div>

      <div className={styles.ordersList}>
        {loading ? (
          [...Array(3)].map((_, index) => (
            <div key={index} className={styles.skeletonCard}>
              <div className={styles.skeletonHeaderRow}>
                <div className={styles.skeletonRestaurant}>
                  <div className={`${styles.skeletonShimmer} ${styles.skeletonAvatar}`} />
                  <div className={styles.skeletonTextCol}>
                    <div className={`${styles.skeletonShimmer} ${styles.skeletonLine}`} />
                    <div className={`${styles.skeletonShimmer} ${styles.skeletonLineShort}`} />
                  </div>
                </div>
                <div className={`${styles.skeletonShimmer} ${styles.skeletonBadge}`} />
              </div>

              <div className={styles.skeletonCarousel}>
                <div className={`${styles.skeletonShimmer} ${styles.skeletonThumb}`} />
                <div className={styles.skeletonTextCol}>
                  <div className={`${styles.skeletonShimmer} ${styles.skeletonLine}`} />
                  <div className={`${styles.skeletonShimmer} ${styles.skeletonLineShort}`} />
                </div>
              </div>

              <div className={styles.skeletonFooterRow}>
                <div className={`${styles.skeletonShimmer} ${styles.skeletonPrice}`} />
                <div className={`${styles.skeletonShimmer} ${styles.skeletonButton}`} />
              </div>
            </div>
          ))
        ) : filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <ShoppingCart size={48} />
            <p>Không có đơn hàng nào</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const nextStatus = getNextStatus(order.status);
            const isUpdating = updatingMap[order.orderExternalId];
            const canCancel = ['placed', 'confirmed'].includes(order.status);

            return (
              <div key={order.orderId} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.restaurantInfo}>
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        backgroundColor: '#e0e0e0',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999'
                      }}
                    >
                      {order.restaurantImage ? (
                        <img
                          src={order.restaurantImage}
                          alt={order.restaurantName || 'Restaurant'}
                          style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }}
                        />
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

                <div className={styles.itemsSlider}>
                  <ItemsCarousel items={order.items} totalQuantity={getTotalQuantity(order.items)} />
                  <div className={styles.sliderInfo}>
                    <div className={styles.quantityBadge}>
                      {getTotalQuantity(order.items)} món
                    </div>
                    <button
                      className={styles.btnViewOrder}
                      onClick={() => navigate('/orderDetail', { state: { orderExternalId: order.orderExternalId } })}
                    >
                      Xem chi tiết <ArrowRight size={16} />
                    </button>
                  </div>
                </div>

                <div className={styles.totalPrice}>
                  <span>Tổng tiền:</span>
                  <span className={styles.price}>{order.totalPrice.toLocaleString('vi-VN')}đ</span>
                </div>

                <div className={styles.actions}>
                  <div className={styles.actionGroup}>
                    {nextStatus && (
                      <button
                        className={styles.btnNextStatus}
                        onClick={() => updateOrderStatus(order)}
                        disabled={isUpdating}
                      >
                        {getNextStatusLabel(nextStatus)}
                      </button>
                    )}
                    {(canCancel && !isUpdating) && (
                      <button
                        className={styles.btnCancelOrder}
                        onClick={() => cancelOrder(order)}
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const ItemsCarousel = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!items || items.length === 0) {
    return (
      <div className={styles.carousel}>
        <div className={styles.carouselContent}>
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999'
            }}
          >
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
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999'
            }}
          >
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

export default MerchantOrdersPage;
