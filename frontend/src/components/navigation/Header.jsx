import styles from './Header.module.css';
import { Search, Bell, ShoppingCart, ChevronDown, MapPin, User, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AddressContext } from '../../context/AddressContext';
import { useContext } from 'react';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import cartApi from '../../api/cartApi';
import CartModal from '../cartModal/CartModal';

export default function Header() {
  const {address} = useContext(AddressContext);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState('');
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutService();
      logoutUser();
      navigate('/auth');
    } catch (error) {
      console.error("Đăng xuất thất bại:", error);
    }
  };

  const resolveUserExternalId = (currentUser) =>
    currentUser?.externalId ||
    currentUser?.userExternalId ||
    currentUser?.user_id ||
    currentUser?.id ||
    currentUser?.username;

  const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

  const loadCart = async (silent = false) => {
    const userExternalId = resolveUserExternalId(user);
    if (!userExternalId) {
      setCartItems([]);
      setCartItemCount(0);
      if (!silent) {
        setCartError('Vui long dang nhap de xem gio hang.');
      }
      return;
    }

    try {
      if (!silent) {
        setCartLoading(true);
        setCartError('');
      }
      const response = await cartApi.getCart({ userExternalId });
      const payload = response?.data ?? response;
      const data = payload?.data ?? payload ?? {};
      const items = data.items || [];
      setCartItems(items);
      setCartItemCount(data.totalItems || 0);
    } catch (error) {
      if (!silent) {
        setCartError('Khong the tai gio hang. Vui long thu lai.');
      }
      setCartItems([]);
    } finally {
      if (!silent) {
        setCartLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!user) {
      setCartItems([]);
      setCartItemCount(0);
      return;
    }
    loadCart(true);
  }, [user]);

  useEffect(() => {
    const handleCartUpdated = (event) => {
      const totalItems = event?.detail?.totalItems;
      if (typeof totalItems === 'number') {
        setCartItemCount(totalItems);
      } else {
        loadCart(true);
      }

      if (isCartOpen) {
        loadCart(true);
      }
    };

    window.addEventListener('cart:updated', handleCartUpdated);
    return () => window.removeEventListener('cart:updated', handleCartUpdated);
  }, [isCartOpen, user]);

  const handleOpenCart = async () => {
    setIsCartOpen(true);
    await loadCart();
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
    setCartError('');
  };

  const handleIncrease = async (item) => {
    const userExternalId = resolveUserExternalId(user);
    if (!userExternalId) return;
    try {
      await cartApi.updateItemQuantity({
        userExternalId,
        itemId: item.itemId,
        quantity: (item.quantity || 0) + 1
      });
      await loadCart(true);
    } catch (error) {
      setCartError('Khong the cap nhat so luong.');
    }
  };

  const handleDecrease = async (item) => {
    const userExternalId = resolveUserExternalId(user);
    if (!userExternalId) return;
    try {
      const nextQty = (item.quantity || 0) - 1;
      if (nextQty <= 0) {
        await cartApi.removeItem({ userExternalId, itemId: item.itemId });
      } else {
        await cartApi.updateItemQuantity({ userExternalId, itemId: item.itemId, quantity: nextQty });
      }

      await loadCart(true);
    } catch (error) {
      setCartError('Khong the cap nhat so luong.');
    }
  };

  const handleRemoveItem = async (item) => {
    const userExternalId = resolveUserExternalId(user);
    if (!userExternalId) return;
    try {
      await cartApi.removeItem({ userExternalId, itemId: item.itemId });
      await loadCart(true);
    } catch (error) {
      setCartError('Khong the xoa mon an.');
    }
  };

  const handleRemoveRestaurant = async (group) => {
    const userExternalId = resolveUserExternalId(user);
    if (!userExternalId) return;
    try {
      await Promise.all(
        group.items.map((item) => cartApi.removeItem({ userExternalId, itemId: item.itemId }))
      );
      await loadCart(true);
    } catch (error) {
      setCartError('Khong the xoa nha hang.');
    }
  };

  return (
    <>
    <div className={styles.header}>
        <div className={styles.logo}>FOODLY</div>
        {address &&
          <div className={styles.withAddress}>
            <div className={styles.searchBar}> 
              <Search size={16} />
              <input 
                className={styles.searchInput}
                type="text"
                placeholder="Tìm nhà hàng hoặc món ăn..."
                onChange={(e) => console.log('Từ khóa tìm kiếm:', e.target.value)}
              />
            </div>
            <button className={styles.addressHolder}><MapPin size={17}/><span  style={{marginLeft: '5px', marginRight: '5px', marginTop: '2px'}}>{address}</span><ChevronDown size={17}/></button>
            <button className={styles.notificationIcon}><Bell size={17} /></button>
            <button className={styles.cartIcon} onClick={handleOpenCart}>
              <ShoppingCart size={17} />
              <span style={{marginTop: '3px'}}>{cartItemCount}</span>
            </button>
          </div>
        }
        <div className={styles.authButton}>
          {user ? 
            (<>
              <button className={styles.bthProfile}><User size={17}/><span style={{marginLeft: '5px', marginTop: '3px'}}>Hồ sơ</span></button>
              <button className={styles.bthProfile} onClick={handleLogout}><LogOut size={17}/><span style={{marginLeft: '5px', marginTop: '3px'}}>Đăng xuất</span></button>
            </>) :
            (<>
              <button className={styles.bthSignIn} onClick={() => navigate('/auth')}>Đăng nhập</button>
            </>)}
        </div>
    </div>
    <CartModal
      isOpen={isCartOpen}
      onClose={handleCloseCart}
      items={cartItems}
      isLoading={cartLoading}
      error={cartError}
      onIncrease={handleIncrease}
      onDecrease={handleDecrease}
      onRemoveItem={handleRemoveItem}
      onRemoveRestaurant={handleRemoveRestaurant}
      formatCurrency={formatCurrency}
    />
    </>
  );
}