import styles from './Sidebar.module.css';
import { useState } from 'react';
import { House, LogOut, UserPlus} from 'lucide-react';
import { HamburgerIcon, PizzaIcon, BowlFoodIcon, BowlSteamIcon, CoffeeIcon, CakeIcon, PintGlassIcon, OrangeIcon, BreadIcon } from "@phosphor-icons/react";
import { useLocation, Link} from 'react-router-dom';

const sidebar = [
  {name: 'Trang chủ', icon: House, path: '/'},
  {name: 'Burger', icon: HamburgerIcon, path: '/category/burger'},
  {name: 'Pizza', icon: PizzaIcon, path: '/category/pizza'},
  {name: 'Cơm', icon: BowlFoodIcon, path: '/category/com'},
  {name: 'Mì & Phở', icon: BowlSteamIcon, path: '/category/mi-pho'},
  {name: 'Bánh Mì', icon: BreadIcon, path: '/category/banh-mi'},
  {name: 'Cà Phê', icon: CoffeeIcon, path: '/category/ca-phe'},
  {name: 'Trà Sữa', icon: PintGlassIcon, path: '/category/tra-sua'},
  {name: 'Nước Ép', icon: OrangeIcon, path: '/category/nuoc-ep'},
  {name: 'Bánh Ngọt', icon: CakeIcon, path: '/category/banh-ngot'},
]

export default function Sidebar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const location = useLocation();

  return (
    <div className={styles.sidebar}>
      <ul>
        {sidebar.map((item, index) =>{
            const Icon = item.icon;
            const IsActive = location.pathname === item.path;

            return (
              <Link 
                key={index}
                to={item.path}
                style={{ textDecoration: 'none', color: 'inherit' }}>
                  <li className={`${styles.sidebarItem} ${IsActive ? styles.IsActive : ''}`}>
                    <Icon size={20} />
                    <span className={styles.sidebarLabel}>{item.name}</span>
                  </li>
              </Link>
            )
        })}
        <hr style={{ marginLeft: '20px', marginRight:'20px' }}/>
        {isLoggedIn ? (
          <div>
            <li className={styles.sidebarItem}><LogOut size={20}/><span className={styles.sidebarLabel}>Đăng xuất</span></li>
          </div>
        ) : (
          <>
            <Link to={'/auth'} style={{ textDecoration: 'none', color: 'inherit' }}>
              <li className={styles.sidebarItem}><UserPlus size={20}/><span className={styles.sidebarLabel}>Đăng nhập</span></li>
            </Link>
          </>
        )}
      </ul>
    </div>
  );
}