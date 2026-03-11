import styles from './Sidebar.module.css';
import { House, Hamburger, EggFried, GlassWater, Wheat } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className={styles.sidebar}>
      <ul>
        <li className={styles.sidebarItem}><House style={{ marginLeft: '30px' }} size={20}/><span style={{marginLeft: '8px', flex: 1}}>Home</span></li>
        <li className={styles.sidebarItem}><Hamburger style={{ marginLeft: '30px' }} size={20}/><span style={{marginLeft: '8px'}}>Fast Food</span></li>
        <li className={styles.sidebarItem}><Wheat style={{ marginLeft: '30px' }} size={20}/><span style={{marginLeft: '8px'}}>Healthy</span></li>
        <li className={styles.sidebarItem}><EggFried style={{ marginLeft: '30px' }} size={20}/><span style={{marginLeft: '8px'}}>Breakfast</span></li>
        <li className={styles.sidebarItem}><GlassWater style={{ marginLeft: '30px' }} size={20}/><span style={{marginLeft: '8px'}}>Drinks</span></li>
        {/* <br />
        <li className={styles.sidebarItem}>Login</li> */}
      </ul>
    </div>
  );
}