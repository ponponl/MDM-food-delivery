import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import RestaurantEditModal from '../../components/restaurantEditModal/RestaurantEditModal';
import restaurantApi from '../../api/restaurantApi';
import orderApi from '../../api/orderApi';
import styles from './MerchantDashboardPage.module.css';
import toast from 'react-hot-toast';

const MerchantDashboardPage = () => {
    const { user, loading, refreshUser } = useAuth();
    const queryClient = useQueryClient();
    const restaurant = user?.restaurantInfo || {};
    const publicId = user?.restaurant_public_id || ''; 
    const isLoading = loading;
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [stats, setStats] = useState({ todayRevenue: 0, todayOrders: 0 });
    const [isStatsLoading, setIsStatsLoading] = useState(true);

    const formatVND = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(value);
    };

    useEffect(() => {
        const fetchTodayStats = async () => {
            if (!publicId) return;
            try {
                setIsStatsLoading(true);
                const today = new Date();
                const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                const response = await orderApi.getRevenueStats({
                    restaurantId: publicId,
                    granularity: 'DAY',
                    timePartition: todayString
                });

                const todayData = (response?.data || []).find(item => item.time_value === todayString);
                
                setStats({
                    todayRevenue: Number(todayData?.total_revenue || 0),
                    todayOrders: Number(todayData?.total_orders || 0)
                });
            } catch (error) {
                console.error("Lỗi lấy thống kê dashboard:", error);
            } finally {
                setIsStatsLoading(false);
            }
        };

        fetchTodayStats();
    }, [publicId]);

    const handleUpdateRestaurant = async (formData) => {
        try {
            setIsUpdating(true);
            formData.append('publicId', publicId);
            await restaurantApi.updateInfo(formData); 
            queryClient.invalidateQueries({ queryKey: ['merchantMe'] });
            toast.success("Cập nhật thông tin nhà hàng thành công!");
            setIsEditModalOpen(false);
        } catch (error) {
            toast.error("Cập nhật thất bại: " + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

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
                                <div className={styles.restaurantMeta}>
                                    <p>📞 {restaurant.phone || 'Chưa cập nhật SĐT'}</p>
                                    <span className={styles.separator}>|</span>
                                    <p>🕒 {restaurant.openTime || '--:--'} - {restaurant.closeTime || '--:--'}</p>
                                </div>
                            </div>
                            <div className={styles.restaurantActions} onClick={() => setIsEditModalOpen(true)}>
                                <button className={styles.primaryBtn}>Chỉnh sửa thông tin</button>
                            </div>
                        </div>

                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>💰</div>
                                <div className={styles.statDetails}>
                                    <h3>Doanh thu hôm nay</h3>
                                    {isStatsLoading ? (
                                        <div className={`${styles.skeleton} ${styles.skeletonValue}`} style={{width: '100px'}} />
                                    ) : (
                                        <p className={styles.statValue}>{formatVND(stats.todayRevenue)}</p>
                                    )}
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>📦</div>
                                <div className={styles.statDetails}>
                                    <h3>Đơn hàng mới</h3>
                                    {isStatsLoading ? (
                                        <div className={`${styles.skeleton} ${styles.skeletonValue}`} style={{width: '60px'}} />
                                    ) : (
                                        <p className={styles.statValue}>{stats.todayOrders}</p>
                                    )}
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>⭐</div>
                                <div className={styles.statDetails}>
                                    <h3>Đánh giá trung bình</h3>
                                    <p className={styles.statValue}>
                                        {restaurant.avgRating ? `${restaurant.avgRating.toFixed(1)} / 5.0` : '0.0 / 5.0'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
            <RestaurantEditModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={restaurant}
                onSubmit={handleUpdateRestaurant}
                isUpdating={isUpdating}
            />
        </div>
    );
};

export default MerchantDashboardPage;