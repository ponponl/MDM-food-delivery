import styles from './Header.module.css';
import { Search, Bell, ShoppingCart, ChevronDown, MapPin, User, LogOut } from 'lucide-react';
import {useState} from 'react';
import { AddressContext } from '../../context/AddressContext';
import { useContext } from 'react';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const {address} = useContext(AddressContext);
  const [cartItemCount, setCartItemCount] = useState(0);
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

  return (
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
            <button className={styles.cartIcon}><ShoppingCart size={17} /><span style={{marginTop: '3px'}}>{cartItemCount}</span></button>
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
  );
}