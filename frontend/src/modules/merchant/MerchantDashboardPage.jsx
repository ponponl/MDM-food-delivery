import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './MerchantDashboardPage.module.css';

const MerchantDashboardPage = () => {
    const { user, logoutUser: logout } = useAuth();
    const navigate = useNavigate();
    
    const restaurant = user?.restaurantInfo || {};

    const handleLogout = async () => {
        await logout();
        navigate('/merchant/login', { replace: true });
    };

    return (
        <div className={styles.dashboardContainer}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarLogo}>
                    <img src="/src/assets/logo.png" alt="Foodly" />
                    <span>Foodly Partner</span>
                </div>
                <nav className={styles.navMenu}>
                    <a href="#" className={`${styles.navItem} ${styles.active}`}>
                        <span className={styles.icon}>📊</span> Tổng quan
                    </a>
                    <a href="#" className={styles.navItem}>
                        <span className={styles.icon}>🍔</span> Quản lý thực đơn
                    </a>
                    <a href="#" className={styles.navItem}>
                        <span className={styles.icon}>📦</span> Đơn hàng (<span className={styles.badge}>3</span>)
                    </a>
                    <a href="#" className={styles.navItem}>
                        <span className={styles.icon}>📈</span> Báo cáo doanh thu
                    </a>
                    <a href="#" className={styles.navItem}>
                        <span className={styles.icon}>⚙️</span> Cài đặt cửa hàng
                    </a>
                </nav>
                <div className={styles.sidebarFooter}>
                    <button className={styles.logoutBtn} onClick={handleLogout}>Đăng xuất</button>
                </div>
            </aside>

            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <h2>Bảng điều khiển <strong>Đây là trang mock để tui test login</strong></h2>
                    <div className={styles.userProfile}>
                        <div className={styles.greeting}>
                            Xin chào, <strong>{user?.username || 'Đối tác'}</strong>
                        </div>
                    </div>
                </header>

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
            </main>
        </div>
    );
};

export default MerchantDashboardPage;
