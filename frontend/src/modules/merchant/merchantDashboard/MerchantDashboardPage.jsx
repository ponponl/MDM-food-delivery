import React, { useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import MerchantMenu from '../merchantMenu/merchantMenuMenu';
import Sidebar from '../../../components/sidebar/Sidebar';
import styles from './MerchantDashboardPage.module.css';

const MerchantDashboardPage = () => {
    const { user, logoutUser: logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    
    const restaurant = user?.restaurantInfo || {};

    const handleLogout = async () => {
        await logout();
        navigate('/merchant/login', { replace: true });
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className={styles.content}>
                        <div className={styles.restaurantBanner}>
                            <div className={styles.restaurantInfo}>
                                <h1>{restaurant.name || 'Tên nhà hàng chưa cập nhật'}</h1>
                                <p className={styles.restaurantType}>{restaurant.type || 'Chưa phân loại'}</p>
                                <p className={styles.restaurantAddress}>📍 {restaurant.address?.full || 'Chưa cập nhật địa chỉ'}</p>
                                <p className={styles.restaurantPhone}>📞 {restaurant.phone || 'Chưa cập nhật SĐT'}</p>
                            </div>
                            <div className={styles.restaurantActions}>
                                <button className={styles.primaryBtn}>Mở cửa ngay</button>
                                <button className={styles.secondaryBtn}>Chỉnh sửa thông tin</button>
                            </div>
                        </div>

                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>💰</div>
                                <div className={styles.statDetails}>
                                    <h3>Doanh thu hôm nay</h3>
                                    <p className={styles.statValue}>1,250,000đ</p>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>📦</div>
                                <div className={styles.statDetails}>
                                    <h3>Đơn hàng mới</h3>
                                    <p className={styles.statValue}>14</p>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>⭐</div>
                                <div className={styles.statDetails}>
                                    <h3>Đánh giá trung bình</h3>
                                    <p className={styles.statValue}>4.8 / 5.0</p>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>👀</div>
                                <div className={styles.statDetails}>
                                    <h3>Lượt xem trang</h3>
                                    <p className={styles.statValue}>342</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'menu':
                return <MerchantMenu />; 
            default:
                return <div className={styles.comingSoon}>Tính năng {activeTab} đang được phát triển...</div>;
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link className={styles.logo} to="/"> FOODLY </Link>
                    <h2>Bảng điều khiển Đối tác</h2>
                </div>
                <div className={styles.userProfile}>
                    <div className={styles.greeting}>
                        Xin chào, <strong>{user?.username || 'Đối tác'}</strong>
                    </div>
                </div>
            </header>

            <Sidebar 
                mode="merchant" 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
            />

            <main className={styles.mainContent}>
                <div className={styles.tabContentWrapper}>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default MerchantDashboardPage;
