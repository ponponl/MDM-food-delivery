import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star, ShoppingCart, ArrowRight } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import styles from './OrderHistoryPage.module.css';
import orderApi from '../../api/orderApi';
import restaurantApi from '../../api/restaurantApi';
import cartApi from '../../api/cartApi';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/common/ConfirmModal';
const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('all');
  const [ordersRaw, setOrdersRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingMap, setUpdatingMap] = useState({});
  const [confirmOrder, setConfirmOrder] = useState(null);

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
        setOrdersRaw([]);
        return;
      }

      setOrdersRaw(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Lỗi tải lịch sử đơn hàng');
      setOrdersRaw([]);
    } finally {
      setLoading(false);
    }
  };

  const restaurantIds = useMemo(() => {
    const ids = ordersRaw.map((order) => order.restaurantId).filter(Boolean);
    return [...new Set(ids)].sort();
  }, [ordersRaw]);

  const { data: restaurantsBulk, isLoading: isRestaurantsLoading } = useQuery({
    queryKey: ['restaurants-bulk', restaurantIds],
    queryFn: async () => {
      const response = await restaurantApi.getBulk(restaurantIds);
      return response?.data?.restaurants || response?.restaurants || {};
    },
    enabled: restaurantIds.length > 0,
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (!restaurantsBulk) return;
    Object.entries(restaurantsBulk).forEach(([publicId, restaurant]) => {
      if (restaurant) {
        queryClient.setQueryData(['restaurant', publicId], restaurant);
      }
    });
  }, [restaurantsBulk, queryClient]);

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

  const orders = useMemo(() => {
    const restaurantMap = restaurantsBulk || {};
    return ordersRaw.map((order) => {
      const restaurant = restaurantMap[order.restaurantId];
      return {
        orderExternalId: order.orderExternalId,
        restaurantId: order.restaurantId,
        restaurantName: restaurant?.name || `Nhà hàng #${order.restaurantId}`,
        restaurantImage: restaurant?.images?.[0] || null,
        status: order.status,
        statusText: getStatusText(order.status),
        totalPrice: order.totalPrice || 0,
        totalItems: Number.isFinite(order.totalItems) ? order.totalItems : 0,
        orderDate: formatDate(order.createdAt),
        createdAt: order.createdAt,
        rating: order.rating || null,
        comment: order.comment || ''
      };
    });
  }, [ordersRaw, restaurantsBulk]);

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(order => order.status === filterStatus);

  const isPageLoading = loading || (restaurantIds.length > 0 && isRestaurantsLoading);

  const handleReorder = async (order) => {
    try {
      const restaurantName = order.restaurantName || `đơn hàng #${order.orderExternalId}`;
      const orderDetailResponse = await orderApi.getOrderDetail(order.orderExternalId);
      const orderDetail = orderDetailResponse?.data || {};
      const items = Array.isArray(orderDetail.items) ? orderDetail.items : [];

      if (items.length === 0) {
        toast.error('Không tìm thấy món ăn để mua lại');
        return;
      }
      
      // Add each item from the order to cart
      for (const item of items) {
        await cartApi.addItem({
          itemId: item.itemId,
          quantity: item.quantity,
          restaurantPublicId: order.restaurantId,
          options: [],
          note: null
        });
      }

      const cartResponse = await cartApi.getCart();
      const cartPayload = cartResponse?.data ?? cartResponse;
      const cartData = cartPayload?.data ?? cartPayload ?? {};
      const totalQty = Number(cartData.totalQty ?? 0);
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { totalQty } }));
      
      toast.success(`Đã thêm các món từ ${restaurantName} vào giỏ hàng`);
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Lỗi khi thêm vào giỏ hàng. Vui lòng thử lại.');
    }
  };

  const handleViewDetails = (order) => {
    navigate(`/orderDetail`, { state: { orderExternalId: order.orderExternalId } });
  };

  const cancelOrder = async (order) => {
    if (order.status !== 'placed') {
      toast.error('Chỉ có thể hủy đơn khi đang ở trạng thái Đã đặt');
      return;
    }

    setUpdatingMap((prev) => ({ ...prev, [order.orderExternalId]: true }));

    try {
      await orderApi.cancelOrder(order.orderExternalId, {
        reason: 'Customer cancelled',
        cancelledBy: 'customer'
      });

      setOrdersRaw((prev) =>
        prev.map((item) =>
          item.orderExternalId === order.orderExternalId
            ? { ...item, status: 'cancelled' }
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

  const openCancelConfirm = (order) => {
    if (!order) return;
    setConfirmOrder(order);
  };

  const handleConfirmCancel = async () => {
    if (!confirmOrder) return;
    await cancelOrder(confirmOrder);
    setConfirmOrder(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed':
        return styles.statusPlaced || '';
      case 'confirmed':
        return styles.statusConfirmed || '';
      case 'preparing':
        return styles.statusPreparing || '';
      case 'ready':
        return styles.statusReady || '';
      case 'delivering':
        return styles.statusDelivering || '';
      case 'completed':
        return styles.statusCompleted;
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return '';
    }
  };

  return (
    <div className={styles.orderHistoryContainer}>
      <div className={styles.header}>
        <h1>Lịch Sử Đơn Hàng</h1>
        {/* <p>Quản lý và xem chi tiết các đơn hàng của bạn</p> */}
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
        {isPageLoading ? (
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
          filteredOrders.map(order => (
            <div key={order.orderExternalId} className={styles.orderCard}>
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
                    <h3>{order.restaurantName || `Đơn hàng #${order.orderExternalId}`}</h3>
                    <p className={styles.orderDate}>{order.orderDate}</p>
                  </div>
                </div>
                <div className={`${styles.status} ${getStatusColor(order.status)}`}>
                  {order.statusText}
                </div>
              </div>

              <div className={styles.orderBody}>
                <div className={styles.orderBodyLeft}>
                  <div className={styles.quantityBadge}>
                    {order.totalItems} món
                  </div>
                  <button
                    className={styles.btnViewOrder}
                    onClick={() => handleViewDetails(order)}
                  >
                    Xem chi tiết <ArrowRight size={16} />
                  </button>
                </div>
                <div className={styles.orderBodyRight}>
                  <div className={styles.totalPrice}>
                    <span>Tổng tiền:</span>
                    <span className={styles.price}>{order.totalPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                  {order.status === 'completed' && (
                    <div className={styles.ratingRow}>
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
                          onClick={() => navigate(`/order/${order.orderExternalId}/review`)}
                        >
                          Đánh giá
                        </button>
                      )}
                    </div>
                  )}
                  <div className={styles.orderBodyActions}>
                    {order.status === 'placed' && (
                      <button
                        className={styles.btnCancelOrder}
                        onClick={() => openCancelConfirm(order)}
                        disabled={!!updatingMap[order.orderExternalId]}
                      >
                        Hủy đơn
                      </button>
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
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={!!confirmOrder}
        title="Xác nhận hủy đơn"
        message="Bạn có chắc muốn hủy đơn này không?"
        confirmText="Hủy đơn"
        isLoading={confirmOrder ? !!updatingMap[confirmOrder.orderExternalId] : false}
        onConfirm={handleConfirmCancel}
        onClose={() => setConfirmOrder(null)}
      />

    </div>
  );
};

export default OrderHistoryPage;
