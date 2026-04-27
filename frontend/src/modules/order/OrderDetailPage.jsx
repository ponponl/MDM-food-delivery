import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPin, Clock, Phone, DollarSign, User, ShoppingCart } from 'lucide-react';
import { SpinnerIcon, CallBellIcon, PackageIcon, CheckIcon, XIcon } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import styles from './OrderDetailPage.module.css';
import orderApi from '../../api/orderApi';
import cartApi from '../../api/cartApi';
import ConfirmModal from '../../components/common/ConfirmModal';
import TrackingMap from '../../components/tracking/TrackingMap'

const OrderDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        // Get orderExternalId from location state or route params
        const orderExternalId = location.state?.orderExternalId || location.state?.order?.orderExternalId;
        
        if (!orderExternalId) {
          toast.error('Không tìm thấy đơn hàng');
          navigate('/orderHistory');
          return;
        }

        const response = await orderApi.getOrderDetail(orderExternalId);
        const data = response?.data;
        
        if (data) {
          setOrderData(data);
        } else {
          toast.error('Không tìm thấy thông tin đơn hàng');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Lỗi tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [location.state]);

  const order = useMemo(() => {
    if (!orderData) return null;

    const restaurantName = orderData.restaurantName || `Nhà hàng #${orderData.restaurantId}`;
    const restaurantImage = orderData.restaurantImageUrl || null;

    const transformedItems = (orderData.items || []).map((item) => ({
      ...item,
      name: item.itemName || item.name || `Món #${item.itemId}`,
      image: item.itemImageUrl || item.image || null,
      description: item.description || ''
    }));

    return {
      orderExternalId: orderData.orderExternalId,
      driverId: orderData.driverId || orderData.driver_id,
      restaurantId: orderData.restaurantId,
      restaurantName,
      restaurantImage,
      status: orderData.status,
      statusText: getStatusText(orderData.status),
      totalPrice: orderData.totalPrice,
      items: transformedItems,
      deliveryAddress: orderData.deliveryAddress?.address || '',
      receiver: orderData.deliveryAddress?.receiver || '',
      phone: orderData.deliveryAddress?.phone || '',
      paymentMethod: orderData.payment?.method || 'cash',
      paymentStatus: orderData.payment?.status === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán',
      orderDate: formatDate(orderData.createdAt),
      createdAt: orderData.createdAt,
      userName: orderData.user?.name,
      userPhone: orderData.user?.phone,
      driver: getDriverInfo(orderData.status, orderData)
    };
  }, [orderData]);

  console.log(orderData);

  function getStatusText(status) {
    const statusMap = {
      'placed': 'Đã đặt',
      'confirmed': 'Xác nhận',
      'delivering': 'Đang giao',
      'completed': 'Đã hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  }

  function getStatusMessage(status) {
    const messageMap = {
      'placed': 'Đợi quán ăn xác nhận',
      'confirmed': 'Đơn của bạn đã được xác nhận',
      'delivering': 'Tài xế đang giao đến bạn'
    };
    return messageMap[status] || '';
  }

  function getDriverInfo(status, rawData) {
    const shouldShowDriver = ['delivering', 'completed', 'cancelled'].includes(status);
    
    if (!shouldShowDriver || !rawData?.driverId) return null;
    
    return {
      name: rawData.driver_name || 'Tài xế Foodly', 
      phone: rawData.driver_phone || 'Đang cập nhật',
      image: 'https://i.pravatar.cc/150?img=12', 
      estimatedTime: status === 'delivering' ? '15-20 phút' : 'Đã giao'
    };
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\//g, '-');
  }

  function getStatusClass(status) {
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
  }

  const canCancel = order ? ['placed'].includes(order.status) : false;

  const cancelOrder = async (currentOrder) => {
    if (!currentOrder) return;

    if (currentOrder.status !== 'placed') {
      toast.error('Chỉ có thể hủy đơn khi đang ở trạng thái Đã đặt');
      return;
    }

    setUpdating(true);

    try {
      await orderApi.cancelOrder(currentOrder.orderExternalId, {
        reason: 'Customer cancelled',
        cancelledBy: 'customer'
      });

      setOrderData((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));
      toast.success('Đã hủy đơn hàng');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Lỗi khi hủy đơn hàng');
    } finally {
      setUpdating(false);
    }
  };

  const handleReorder = async (currentOrder) => {
    if (!currentOrder) return;

    setUpdating(true);

    try {
      const restaurantName = currentOrder.restaurantName || `đơn hàng #${currentOrder.orderExternalId}`;
      const orderDetailResponse = await orderApi.getOrderDetail(currentOrder.orderExternalId);
      const orderDetail = orderDetailResponse?.data || {};
      const items = Array.isArray(orderDetail.items) ? orderDetail.items : [];

      if (items.length === 0) {
        toast.error('Không tìm thấy món ăn để mua lại');
        return;
      }

      for (const item of items) {
        await cartApi.addItem({
          itemId: item.itemId,
          quantity: item.quantity,
          restaurantPublicId: currentOrder.restaurantId,
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
    } finally {
      setUpdating(false);
    }
  };

  const slugify = (value) => (
    (value ?? '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .toLowerCase()
  );

  const handleRestaurantClick = () => {
    if (!order?.restaurantId) return;
    const slug = slugify(order.restaurantName);
    navigate(`/restaurant/${slug}-${order.restaurantId}`);
  };

  return (
    <div className={styles.detailContainer}>
      <div className={styles.pageHeader}>
        <button className={styles.btnBack} onClick={() => navigate('/orderHistory')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Chi Tiết Đơn Hàng</h1>
        <div style={{ width: 24 }}></div>
      </div>

      {loading ? (
        <div className={styles.content}>
          <div className={styles.section}>
            <div className={styles.skeletonStatusRow}>
              <div className={`${styles.skeletonShimmer} ${styles.skeletonCircle}`} />
              <div className={styles.skeletonTextCol}>
                <div className={`${styles.skeletonShimmer} ${styles.skeletonLine}`} />
                <div className={`${styles.skeletonShimmer} ${styles.skeletonLineShort}`} />
                <div className={`${styles.skeletonShimmer} ${styles.skeletonLineShort}`} />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={`${styles.skeletonShimmer} ${styles.skeletonSectionTitle}`} />
            {[...Array(3)].map((_, index) => (
              <div key={index} className={styles.skeletonRow}>
                <div className={`${styles.skeletonShimmer} ${styles.skeletonCircleSmall}`} />
                <div className={styles.skeletonTextCol}>
                  <div className={`${styles.skeletonShimmer} ${styles.skeletonLine}`} />
                  <div className={`${styles.skeletonShimmer} ${styles.skeletonLineShort}`} />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.section}>
            <div className={`${styles.skeletonShimmer} ${styles.skeletonSectionTitle}`} />
            {[...Array(3)].map((_, index) => (
              <div key={index} className={styles.skeletonItemRow}>
                <div className={`${styles.skeletonShimmer} ${styles.skeletonThumb}`} />
                <div className={styles.skeletonTextCol}>
                  <div className={`${styles.skeletonShimmer} ${styles.skeletonLine}`} />
                  <div className={`${styles.skeletonShimmer} ${styles.skeletonLineShort}`} />
                </div>
                <div className={`${styles.skeletonShimmer} ${styles.skeletonAmount}`} />
              </div>
            ))}
          </div>

          <div className={styles.section}>
            <div className={`${styles.skeletonShimmer} ${styles.skeletonSectionTitle}`} />
            <div className={styles.skeletonBlock}>
              <div className={`${styles.skeletonShimmer} ${styles.skeletonLine}`} />
              <div className={`${styles.skeletonShimmer} ${styles.skeletonLine}`} />
              <div className={`${styles.skeletonShimmer} ${styles.skeletonLineShort}`} />
            </div>
          </div>
        </div>
      ) : !order ? (
        <div className={styles.content}>
          <p>Không tìm thấy đơn hàng</p>
        </div>
      ) : (
        <div className={styles.content}>
          {/* Order Status */}
          <div className={styles.section}>
            <div className={`${styles.orderStatus} ${getStatusClass(order.status)}`}>
              <div className={styles.statusBadge}>
                {order.status === 'placed' && <SpinnerIcon size={20} color="#ffffff" />}
                {order.status === 'confirmed' && <CallBellIcon size={20} color="#ffffff" />}
                {order.status === 'delivering' && <PackageIcon size={20} color="#ffffff" />}
                {order.status === 'completed' && <CheckIcon size={20} color="#ffffff" />}
                {order.status === 'cancelled' && <XIcon size={20} color="#ffffff" />}
              </div>
              <div className={styles.statusInfo}>
                <h2>{order.statusText}</h2>
                <p>Mã đơn: #{order.orderExternalId}</p>
                <p>{order.orderDate}</p>
                {(order.status === 'delivering' || order.status === 'completed') && order.driver && (
                  <p style={{ color: '#1565c0', fontWeight: 'bold', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} />
                    Giao dự kiến: {order.driver.estimatedTime}
                  </p>
                )}
                {getStatusMessage(order.status) && (
                  <p className={styles.statusMessage}>{getStatusMessage(order.status)}</p>
                )}
              </div>
              <div className={styles.statusActions}>
                {canCancel && (
                  <button
                    className={styles.btnCancelOrder}
                    onClick={() => setIsCancelOpen(true)}
                    disabled={updating}
                  >
                    Hủy đơn
                  </button>
                )}
                <button
                  className={styles.btnReorder}
                  onClick={() => handleReorder(order)}
                  disabled={updating}
                >
                  <ShoppingCart size={16} />
                  Mua lại
                </button>
              </div>
            </div>
          </div>

          {order.restaurantImage && (
            <div className={styles.sectionRestaurant}>
              <img
                src={order.restaurantImage}
                alt={order.restaurantName || 'Restaurant'}
              />
              <div className={styles.restaurantInfo}>
                <h3 className={styles.sectionTitle}>Nhà hàng</h3>
                <h3
                  className={styles.restaurantName}
                  role="button"
                  tabIndex={0}
                  onClick={handleRestaurantClick}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      handleRestaurantClick();
                    }
                  }}
                >
                  {order.restaurantName}
                </h3>
              </div>
            </div>
          )}

          {/* Items Ordered */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Các Món Đã Đặt</h3>
            <div className={styles.itemsList}>
              {order.items.map((item, idx) => (
                <div key={idx} className={styles.orderItem}>
                  {item.image && (
                    <img src={item.image} alt={item.name || 'Menu item'} />
                  )}
                  <div className={styles.itemInfo}>
                    <h4>{item.name}</h4>
                    <p>Số lượng: {item.quantity}</p>
                    {item.notes && <p className={styles.notes}>Ghi chú: {item.notes}</p>}
                  </div>
                  <div className={styles.priceInfo}>
                    <div className={styles.priceRow}>
                        <div className={styles.snapshotPrice}>{item.snapshotPrice?.toLocaleString('vi-VN') || 0}đ</div>
                        <div className={styles.qtyText}>x {item.quantity}</div>
                      </div>
                    <div className={styles.itemPrice}>{((item.snapshotPrice ?? 0) * item.quantity).toLocaleString('vi-VN')}đ</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

              {(() => {
                if (['placed', 'confirmed'].includes(order.status)) return null;

                const hasRestaurantLoc = orderData?.restaurantLat && orderData?.restaurantLng;
                const safeRestaurantLoc = hasRestaurantLoc 
                  ? [Number(orderData.restaurantLat), Number(orderData.restaurantLng)] 
                  : null;

                const hasDestLoc = orderData?.deliveryAddress?.location?.coordinates?.length >= 2;
                const safeDestinationLoc = hasDestLoc 
                  ? [
                      Number(orderData.deliveryAddress.location.coordinates[1]), 
                      Number(orderData.deliveryAddress.location.coordinates[0])  
                    ] 
                  : null;

                return (
                  <TrackingMap 
                    orderId={order.orderExternalId}
                    restaurantLoc={safeRestaurantLoc} 
                    destinationLoc={safeDestinationLoc}
                    status={order.status}
                    driverId={order.driverId} 
                  />
                );
              })()}

          {/* Delivery Address */}
          <div className={styles.section} style={{marginTop: '20px'}}>
            <h3 className={styles.sectionTitle}>Thông tin giao hàng</h3>
            <div className={styles.addressBox}>
              <User size={20} color="#1565c0"/>
              <div>
                <p className={styles.addressLabel}>Người nhận</p>
                <p className={styles.addressText}>{order.receiver}</p>
              </div>
            </div>
            <div className={styles.addressBox}>
              <Phone size={20} color="#1565c0" />
              <div>
                <p className={styles.addressLabel}>Số điện thoại</p>
                <p className={styles.addressText}>{order.phone}</p>
              </div>
            </div>
            <div className={styles.addressBox}>
              <MapPin size={20} color="#1565c0" />
              <div>
                <p className={styles.addressLabel}>Giao đến</p>
                <p className={styles.addressText}>{order.deliveryAddress}</p>
              </div>
            </div>
          </div>

          {order && order.driver && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Thông Tin Tài Xế</h3>
            <div className={styles.driverCard}>
              <img 
                src={order.driver.image} 
                alt={order.driver.name} 
                className={styles.driverImage} 
              />
              
              <div className={styles.driverInfo}>
                <div className={styles.driverHeader}>
                  <h4>{order.driver.name}</h4>
                  <p className={styles.driverPhone}>
                    <Phone size={14} style={{ marginRight: '6px' }} />
                    {order.driver.phone}
                  </p>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Payment Info */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Thông Tin Thanh Toán</h3>
            <div className={styles.paymentDetails}>
              <div className={styles.paymentRow}>
                <span>Tiền hàng:</span>
                <span>{order.totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className={styles.paymentRowTotal}>
                <span>Tổng cộng:</span>
                <span>{order.totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className={styles.paymentMethod}>
                <div>
                  <p className={styles.label}>Phương thức thanh toán</p>
                  <p className={styles.paymentMethodText}>{order.paymentMethod}</p>
                </div>
                <div>
                  <p className={styles.label}>Trạng thái</p>
                  <p className={styles.paid}>{order.paymentStatus}</p>
                </div>
              </div>
            </div>
          </div>


          {/* Additional Info */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Thông Tin Khác</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <Clock size={20} color="#1565c0" />
                <div>
                  <p className={styles.label}>Thời gian đặt hàng</p>
                  <p>{order.orderDate}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <DollarSign size={20} color="#f57c00" />
                <div>
                  <p className={styles.label}>Tổng đơn hàng</p>
                  <p className={styles.finalPrice}>{order.totalPrice.toLocaleString('vi-VN')}đ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isCancelOpen}
        title="Xác nhận hủy đơn"
        message={`Bạn chắc chắn muốn hủy đơn #${order?.orderExternalId}?`}
        confirmText="Hủy đơn"
        cancelText="Quay lại"
        isLoading={updating}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={async () => {
          if (!order) return;
          await cancelOrder(order);
          setIsCancelOpen(false);
        }}
      />
    </div>
  );
};

export default OrderDetailPage;
