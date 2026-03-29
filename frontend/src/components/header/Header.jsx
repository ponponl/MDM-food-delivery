import styles from './Header.module.css';
import { Search, Bell, ShoppingCart, ChevronDown, MapPin, User } from 'lucide-react';
import { FishSimpleIcon, UserCircleIcon, SignOutIcon } from '@phosphor-icons/react';
import { useEffect, useState, useRef } from 'react';
import { AddressContext } from '../../context/AddressContext';
import { useContext } from 'react';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import cartApi from '../../api/cartApi';
import searchApi from '../../api/searchApi';
import CartModal from '../cartModal/CartModal';

export default function Header() {
  const {address} = useContext(AddressContext);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState([]);
  const searchTimeoutRef = useRef(null);
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsProfileOpen(false);
      await logoutService();
      logoutUser();
      navigate('/auth');
    } catch (error) {
      console.error("Đăng xuất thất bại:", error);
    }
  };

  const handleOpenProfile = () => {
    setIsProfileOpen(true);
  };

  const handleCloseProfile = () => {
    setIsProfileOpen(false);
  };

  const handleViewProfile = () => {
    navigate('/profile');
    setIsProfileOpen(false);
  };

  const handleSearch = async (searchTerm) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm || !searchTerm.trim()) {
      setSearchResult([]);
      setLoading(false);
      return;
    }

    // Debounce search - wait 300ms after user stops typing
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await searchApi.searchAll(searchTerm, 20);
        const results = response?.data?.data || response?.data || [];
        
        // Extract suggestions prioritizing categories first
        const categories = new Set();
        const restaurants = new Set();
        const foods = new Set();
        
        results.forEach(restaurant => {
          // Extract categories from matched foods
          restaurant.matchedFoods?.forEach(food => {
            if (food.category) {
              categories.add(food.category);
            }
            if (food.name) {
              foods.add(food.name);
            }
          });
          
          // Add restaurant name
          if (restaurant.restaurantName) {
            restaurants.add(restaurant.restaurantName);
          }
        });
        
        // Combine with priority: categories > restaurants > foods
        const suggestions = [
          ...Array.from(categories).map(cat => ({ text: cat, type: 'category' })),
          ...Array.from(restaurants).map(rest => ({ text: rest, type: 'restaurant' })),
          ...Array.from(foods).map(food => ({ text: food, type: 'food' }))
        ].slice(0, 10);
        
        setSearchResult(suggestions);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResult([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelectKeyword = (keyword) => {
    // Navigate to search results page with keyword
    const searchTerm = typeof keyword === 'string' ? keyword : keyword.text;
    navigate(`/search/${encodeURIComponent(searchTerm)}`);
    setQuery('');
    setSearchResult([]);
  };

  const getSuggestClassName = (type) => {
    const typeMap = {
      category: styles.suggestCategory,
      restaurant: styles.suggestRestaurant,
      food: styles.suggestFood
    };
    return `${styles.suggestItem} ${typeMap[type] || ''}`;
  };

  const getDisplayName = () => {
    if (!user) {
      return 'User';
    }
    return user.username || user.name || user.email || 'User';
  };

  const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

  const loadCart = async (silent = false) => {
    if (!user) {
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
      const response = await cartApi.getCart();
      const payload = response?.data ?? response;
      const data = payload?.data ?? payload ?? {};
      const items = data.items || [];
      setCartItems(items);
      setCartItemCount(data.totalQty || 0);
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
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleCartUpdated = (event) => {
      const totalQty = event?.detail?.totalQty;
      const deltaQty = event?.detail?.deltaQty;

      if (typeof totalQty === 'number') {
        setCartItemCount(totalQty);
      } else if (typeof deltaQty === 'number') {
        setCartItemCount((prev) => Math.max(0, prev + deltaQty));
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
    try {
      await cartApi.updateItemQuantity({
        itemId: item.itemId,
        quantity: (item.quantity || 0) + 1,
        restaurantPublicId: item.restaurantId,
        options: item.options || [],
        note: item.note || null
      });
      await loadCart(true);
    } catch (error) {
      setCartError('Khong the cap nhat so luong.');
    }
  };

  const handleDecrease = async (item) => {
    try {
      const nextQty = (item.quantity || 0) - 1;
      if (nextQty <= 0) {
        await cartApi.removeItem({
          itemId: item.itemId,
          restaurantPublicId: item.restaurantId,
          options: item.options || [],
          itemKey: item.itemKey || null
        });
      } else {
        await cartApi.updateItemQuantity({
          itemId: item.itemId,
          quantity: nextQty,
          restaurantPublicId: item.restaurantId,
          options: item.options || [],
          note: item.note || null
        });
      }

      await loadCart(true);
    } catch (error) {
      setCartError('Khong the cap nhat so luong.');
    }
  };

  const handleRemoveItem = async (item) => {
    try {
      await cartApi.removeItem({
        itemId: item.itemId,
        restaurantPublicId: item.restaurantId,
        options: item.options || [],
        itemKey: item.itemKey || null
      });
      await loadCart(true);
    } catch (error) {
      setCartError('Khong the xoa mon an.');
    }
  };

  const handleRemoveRestaurant = async (group) => {
    try {
      await Promise.all(
        group.items.map((item) => cartApi.removeItem({
          itemId: item.itemId,
          restaurantPublicId: item.restaurantId,
          options: item.options || [],
          itemKey: item.itemKey || null
        }))
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
              <form className={styles.searchForm}>
                              <input 
                                className={styles.searchInput}
                                type="text"
                                placeholder="Tìm nhà hàng hoặc món ăn..."
                                value={query}
                                onChange={(e) => {
                                  const nextQuery = e.target.value;
                                  setQuery(nextQuery);
                                  handleSearch(nextQuery);
                                }}
                              />
                            </form>
                            {loading && <p className={styles.searchLoading}>Đang tìm kiếm...</p>}
              
                            {searchResult.length > 0 && (
                              <div className={styles.searchResult}>
                                {searchResult.map((item, index) => (
                                  <div 
                                    className={getSuggestClassName(item.type)}
                                    key={index}
                                    onClick={() => handleSelectKeyword(item)}
                                  >
                                    <Search size={14} />
                                    <span className={styles.suggestText}>{item.text}</span>
                                    {item.type === 'category' && <span className={styles.badge}>Danh mục</span>}
                                  </div>
                                ))}
                              </div>
                            )}
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
            (
              <button className={styles.bthProfile} onClick={handleOpenProfile}>
                <User size={17}/>
                <span style={{marginLeft: '5px', marginTop: '3px'}}>Hồ sơ</span>
              </button>
            ) :
            (<>
              <button className={styles.bthSignIn} onClick={() => navigate('/auth')}>Đăng nhập</button>
            </>)}
        </div>
    </div>
    {isProfileOpen && (
      <div className={styles.profileOverlay} onClick={handleCloseProfile}>
        <div className={styles.profileModal} onClick={(event) => event.stopPropagation()}>
          <div className={styles.profileHeader}>
            <div className={styles.profileAvatar}>
              <FishSimpleIcon size={20} weight="fill" />
            </div>
            <div className={styles.profileName}>{getDisplayName()}</div>
          </div>
          <div className={styles.profileDivider} />
          <button className={styles.profileItem} type="button" onClick={handleViewProfile}>
            <span className={styles.profileItemIcon}><UserCircleIcon size={20} /></span>
            Thông tin cá nhân
          </button>
          <button className={styles.profileItem} type="button" onClick={handleLogout}>
            <span className={styles.profileItemIcon}><SignOutIcon size={20} /></span>
            Đăng xuất
          </button>
        </div>
      </div>
    )}
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