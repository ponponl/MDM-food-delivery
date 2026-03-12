
import styles from './Header.module.css';
import { Search, Bell, ShoppingCart, ChevronDown, MapPin, User } from 'lucide-react';
import {useState} from 'react';

export default function Header() {
  const [hasAdrress, setHasAddress] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <div className={styles.header}>
        <div className={styles.logo}>FOODLY</div>
        {hasAdrress &&
          <div className={styles.withAddress}>
            <div className={styles.searchBar}> 
              <Search size={16} />
              <input 
                className={styles.searchInput}
                type="text"
                placeholder="Search for restaurants or dishes..."
                onChange={(e) => console.log('Search query:', e.target.value)}
              />
            </div>
            <button className={styles.addressHolder}><MapPin size={17}/><span  style={{marginLeft: '5px', marginRight: '5px', marginTop: '2px'}}>123 Main St</span><ChevronDown size={17}/></button>
            <button className={styles.notificationIcon}><Bell size={17} /></button>
            <button className={styles.cartIcon}><ShoppingCart size={17} /><span style={{marginTop: '3px'}}>{cartItemCount}</span></button>
          </div>
        }
        <div className={styles.authButton}>
          {isLoggedIn ? 
            (<>
              <button className={styles.bthProfile}><User size={17}/><span style={{marginLeft: '5px', marginTop: '3px'}}>Profile</span></button>
            </>) :
            (<>
              <button className={styles.bthSignUp}>Sign Up</button>
              <button className={styles.bthSignIn}>Sign In</button>
            </>)}
        </div>
    </div>
  );
}