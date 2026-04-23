import styles from './Sidebar.module.css';
import { House, UserPlus, List, Sparkles, LayoutDashboard, UtensilsCrossed, Package, BarChart3, Settings } from 'lucide-react';
import { HamburgerIcon, PizzaIcon, BowlFoodIcon, BowlSteamIcon, CoffeeIcon, CakeIcon, PintGlassIcon, OrangeIcon, BreadIcon } from "@phosphor-icons/react";
import { useLocation, Link} from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CUSTOMER_MENU  = [
  {name: 'Trang chủ', icon: House, path: '/'},
  {name: 'Dành cho bạn', icon: Sparkles, path: '/recommendations'},
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

const MERCHANT_MENU = [
    { id: 'overview', name: 'Tổng quan', icon: LayoutDashboard },
    { id: 'menu', name: 'Quản lý thực đơn', icon: UtensilsCrossed },
    { id: 'orders', name: 'Đơn hàng', icon: Package, badge: 3 },
    { id: 'reports', name: 'Báo cáo doanh thu', icon: BarChart3 },
    { id: 'settings', name: 'Cài đặt cửa hàng', icon: Settings },
];

export default function Sidebar({ mode = 'customer', activeTab, onTabChange }) {
    const { user } = useAuth();
    const location = useLocation();

    const menuItems = mode === 'merchant' ? MERCHANT_MENU : CUSTOMER_MENU;

    return (
        <div className={`${styles.sidebar} ${mode === 'merchant' ? styles.merchantSidebar : ''}`}>
            <ul>
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    
                    const isActive = mode === 'customer' 
                        ? location.pathname === item.path 
                        : activeTab === item.id;

                    const content = (
                        <li className={`${styles.sidebarItem} ${isActive ? styles.IsActive : ''}`}>
                            <Icon size={20} />
                            <span className={styles.sidebarLabel}>{item.name}</span>
                            {item.badge && <span className={styles.badge}>{item.badge}</span>}
                        </li>
                    );

                    if (mode === 'customer') {
                        return (
                            <Link key={index} to={item.path} style={{ textDecoration: 'none', color: 'inherit' }}>
                                {content}
                            </Link>
                        );
                    }

                    return (
                        <button key={item.id} className={styles.tabButton} onClick={() => onTabChange(item.id)}>
                            {content}
                        </button>
                    );
                })}

                {mode === 'customer' && (
                    <>
                        <hr style={{ margin: '10px 20px', opacity: 0.3 }} />
                        {user ? (
                            <Link to={'/orderHistory'} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <li className={styles.sidebarItem}><List size={20} /><span className={styles.sidebarLabel}>Đơn hàng</span></li>
                            </Link>
                        ) : (
                            <Link to={'/auth'} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <li className={styles.sidebarItem}><UserPlus size={20} /><span className={styles.sidebarLabel}>Đăng nhập</span></li>
                            </Link>
                        )}
                    </>
                )}
            </ul>
        </div>
    );
  }