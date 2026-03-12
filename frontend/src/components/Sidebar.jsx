import styles from './Sidebar.module.css';
import { useState } from 'react';
import { House, Hamburger, EggFried, GlassWater, Wheat, LogOut, UserPlus, KeyRound } from 'lucide-react';
import { useLocation, Link} from 'react-router-dom';

const sidebar = [
  {name: 'Home', icon: House, path: '/home'},
  {name: 'Fast Food', icon: Hamburger, path: '/category/FastFood'},
  {name: 'Healthy', icon: Wheat, path: '/category/Healthy'},
  {name: 'Breakfast', icon: EggFried, path: '/category/Breakfast'},
  {name: 'Drinks', icon: GlassWater, path: '/category/Drinks'},
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
                    <Icon style={{ marginLeft: '30px' }} size={20}/><span style={{marginLeft: '8px', flex: 1}}>{item.name}</span>
                  </li>
              </Link>
            )
        })}
        <hr style={{ marginLeft: '20px', marginRight:'20px' }}/>
        {isLoggedIn ? (
          <div>
            <li className={styles.sidebarItem}><LogOut style={{ marginLeft: '30px' }} size={20}/><span style={{marginLeft: '8px', flex: 1}}>Logout</span></li>
          </div>
        ) : (
          <>
            <Link to={'/signup'} style={{ textDecoration: 'none', color: 'inherit' }}>
              <li className={styles.sidebarItem}><UserPlus style={{ marginLeft: '30px' }} size={20}/><span style={{marginLeft: '8px', flex: 1}}>Sign Up</span></li>
            </Link>
            <Link to={'/signin'} style={{ textDecoration: 'none', color: 'inherit' }}>
              <li className={styles.sidebarItem}><KeyRound style={{ marginLeft: '30px' }} size={20}/><span style={{marginLeft: '8px', flex: 1}}>Sign In</span></li>
            </Link>
          </>
        )}
      </ul>
    </div>
  );
}