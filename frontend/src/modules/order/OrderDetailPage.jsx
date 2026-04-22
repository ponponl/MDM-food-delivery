import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Clock, Phone, DollarSign, User } from 'lucide-react';
import { SpinnerIcon, CallBellIcon, PackageIcon, CheckIcon, XIcon } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import styles from './OrderDetailPage.module.css';
import orderApi from '../../api/orderApi';
import restaurantApi from '../../api/restaurantApi';

const OrderDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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
          let restaurantName = '';
          let restaurantImage = null;
          let restaurantMenuImage = null;
          let transformedItems = data.items || [];
          
          try {
            const restaurantRes = await restaurantApi.getById(data.restaurantId);
            const restaurant = restaurantRes?.data || restaurantRes;
            restaurantName = restaurant?.name || '';
            restaurantImage = restaurant?.images?.[0] || null;
            restaurantMenuImage = restaurant?.menu?.[0]?.image || restaurant?.menu?.[0]?.images?.[0] || null;
            
            const menuItemMap = {};
            restaurant?.menu?.forEach(item => {
              menuItemMap[item._id] = {
                name: item.name,
                image: item.image || item.images?.[0] || null,
                description: item.description
              };
            });
            
            transformedItems = data.items.map(item => ({
              ...item,
              name: menuItemMap[item.itemId]?.name || `Món #${item.itemId}`,
              image: menuItemMap[item.itemId]?.image || menuItemMap[item.itemId]?.images?.[0] || null,
              description: menuItemMap[item.itemId]?.description || ''
            }));
          } catch (restaurantError) {
            console.warn('Error fetching restaurant details:', restaurantError);
          }

          const transformedOrder = {
            orderExternalId: data.orderExternalId,
            restaurantId: data.restaurantId,
            restaurantName: restaurantName || `Nhà hàng #${data.restaurantId}`,
            restaurantImage: restaurantImage,
            restaurantMenuImage,
            status: data.status,
            statusText: getStatusText(data.status),
            totalPrice: data.totalPrice,
            items: transformedItems,
            deliveryAddress: data.deliveryAddress?.address || '',
            receiver: data.deliveryAddress?.receiver || '',
            phone: data.deliveryAddress?.phone || '',
            paymentMethod: data.payment?.method || 'cash',
            paymentStatus: data.payment?.status === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán',
            orderDate: formatDate(data.createdAt),
            createdAt: data.createdAt,
            userName: data.user?.name,
            userPhone: data.user?.phone,
            driver: getDriverInfo(data.status)
          };
          
          setOrder(transformedOrder);
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

  const getStatusMessage = (status) => {
    const messageMap = {
      'placed': 'Đợi quán ăn xác nhận',
      'confirmed': 'Tài xế đang lấy đơn',
      'preparing': 'Đơn của bạn đang được chuẩn bị',
      'delivering': 'Tài xế đang giao đến bạn'
    };
    return messageMap[status] || '';
  };

  const getDriverInfo = (status) => {
    // Mock driver data - sẽ được cập nhật khi có dữ liệu thực từ API
    const shouldShowDriver = ['confirmed', 'preparing', 'delivering', 'completed', 'cancelled'].includes(status);
    
    if (!shouldShowDriver) return null;

    return {
      name: 'Nguyễn Văn A',
      phone: '0912345678',
      vehicle: 'Honda Wave - 30A12345',
      image: 'https://i.pravatar.cc/150?img=12',
      estimatedTime: '15-20 phút'
    };
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

  const getStatusClass = (status) => {
    switch (status) {
      case 'placed':
        return styles.statusPlaced || '';
      case 'confirmed':
        return styles.statusConfirmed || '';
      case 'preparing':
        return styles.statusConfirmed || '';
      case 'ready':
        return styles.statusDelivering || '';
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
                {order.status === 'preparing' && <PackageIcon size={20} color="#ffffff" />}
                {order.status === 'ready' && <PackageIcon size={20} color="#ffffff" />}
                {order.status === 'delivering' && <PackageIcon size={20} color="#ffffff" />}
                {order.status === 'completed' && <CheckIcon size={20} color="#ffffff" />}
                {order.status === 'cancelled' && <XIcon size={20} color="#ffffff" />}
              </div>
              <div className={styles.statusInfo}>
                <h2>{order.statusText}</h2>
                <p>Mã đơn: #{order.orderExternalId}</p>
                <p>{order.orderDate}</p>
                {order.status === 'delivering' && order.driver && (
                  <p style={{ color: '#1565c0', fontWeight: 'bold', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} />
                    Giao dự kiến: {order.driver.estimatedTime}
                  </p>
                )}
                {getStatusMessage(order.status) && (
                  <p className={styles.statusMessage}>{getStatusMessage(order.status)}</p>
                )}
              </div>
            </div>
          </div>

          {(order.restaurantMenuImage || order.restaurantImage) && (
            <div className={styles.sectionRestaurant}>
              <img
                src={order.restaurantImage}
                alt={order.restaurantName || 'Restaurant'}
              />
              <div className={styles.restaurantInfo}>
                <h3 className={styles.sectionTitle}>Nhà hàng</h3>
                <h3 className={styles.restaurantName}>{order.restaurantName}</h3>
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
                  <div className={styles.itemPrice}>
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className={styles.section}>
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
                  <p>{order.paymentMethod}</p>
                </div>
                <div>
                  <p className={styles.label}>Trạng thái</p>
                  <p className={styles.paid}>{order.paymentStatus}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Info */}
          {order.driver && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Thông Tin Tài Xế</h3>
              <div className={styles.driverCard}>
                <img src={order.driver.image} alt={order.driver.name} className={styles.driverImage} />
                <div className={styles.driverInfo}>
                  <div>
                    <h4>{order.driver.name}</h4>
                    <p className={styles.driverPhone}>{order.driver.phone}</p>
                    <p className={styles.driverVehicle}>{order.driver.vehicle}</p>
                  </div>
                </div>
              </div>
            </div>
          )}


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
    </div>
  );
};

export default OrderDetailPage;
