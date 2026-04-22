import { useLocation, Link } from 'react-router-dom';
import {
    ChartLineUpIcon,
    ForkKnifeIcon,
    PackageIcon,
    ChartBarIcon,
    GearSixIcon
} from '@phosphor-icons/react';
import styles from './MerchantSidebar.module.css';

const sidebarItems = [
    { name: 'Tổng quan', icon: ChartLineUpIcon, path: '/merchant/dashboard' },
    { name: 'Thực đơn', icon: ForkKnifeIcon, path: '/merchant/menu' },
    { name: 'Đơn hàng', icon: PackageIcon, path: '/merchant/orders' },
    { name: 'Thống kê', icon: ChartBarIcon, path: '/merchant/reports' }
    // { name: 'Cài đặt cửa hàng', icon: GearSixIcon, path: '/merchant/settings' }
];

const MerchantSidebar = () => {
    const location = useLocation();

    return (
        <aside className={styles.sidebar}>
            <ul className={styles.menu}>
                {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link key={item.path} to={item.path} className={styles.link}>
                            <li className={`${styles.item} ${isActive ? styles.active : ''}`}>
                                <Icon size={20} />
                                <span className={styles.label}>{item.name}</span>
                            </li>
                        </Link>
                    );
                })}
            </ul>
        </aside>
    );
};

export default MerchantSidebar;
