import React from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './MerchantDashboardPage.module.css';

const MerchantDashboardPage = () => {
    const { user, loading } = useAuth();
    const restaurant = user?.restaurantInfo || {};
    const isLoading = loading;

    return (
        <div className={styles.page}>
            <div className={styles.content}>
                {isLoading ? (
                    <>
                        <div className={styles.restaurantBanner}>
                            <div className={styles.restaurantInfo}>
                                <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                                <div className={`${styles.skeleton} ${styles.skeletonChip}`} />
                                <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
                                <div className={`${styles.skeleton} ${styles.skeletonLineShort}`} />
                            </div>
                            <div className={styles.restaurantActions}>
                                <div className={`${styles.skeleton} ${styles.skeletonButton}`} />
                                <div className={`${styles.skeleton} ${styles.skeletonButton}`} />
                            </div>
                        </div>

                        <div className={styles.statsGrid}>
                            {[0, 1, 2, 3].map((item) => (
                                <div className={styles.statCard} key={`stat-skeleton-${item}`}>
                                    <div className={`${styles.skeleton} ${styles.skeletonIcon}`} />
                                    <div className={styles.statDetails}>
                                        <div className={`${styles.skeleton} ${styles.skeletonLabel}`} />
                                        <div className={`${styles.skeleton} ${styles.skeletonValue}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div className={styles.restaurantBanner}>
                            <div className={styles.restaurantBackground}>
                                <img src={restaurant.background?.[0] || '/src/assets/home-banner.png'} alt="Restaurant Background" />
                            </div>
                            <div className={styles.restaurantImage}>
                                <img src={restaurant.images?.[0] || '/src/assets/pizza.png'} alt={restaurant.name} />
                            </div>
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
                    </>
                )}
            </div>
        </div>
    );
};

export default MerchantDashboardPage;