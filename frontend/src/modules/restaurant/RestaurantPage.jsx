import { useState, useEffect } from 'react';
import { Star, Clock, MapPin } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Header from '../../components/navigation/Header'; 
import Sidebar from '../../components/navigation/Sidebar';
import MenuSidebar from '../../components/menuSideBar/menuSideBar.jsx';
import MenuItemsList from '../../components/menuItemList/MenuItemList.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import restaurantApi from '../../api/restaurantApi';
import cartApi from '../../api/cartApi';
import styles from './RestaurantPage.module.css';

const MOCK_REVIEWS = [
    { id: 1, user_name: "Nguyễn Văn A", rating: 5, comment: "Đồ ăn rất ngon, giao hàng nhanh!", created_at: "2024-12-10 09:24" },
    { id: 2, user_name: "Trần Thị B", rating: 4, comment: "Pizza còn nóng hổi, tuy nhiên hơi ít phô mai.", created_at: "2024-12-08 18:10" },
    { id: 3, user_name: "Lê Văn C", rating: 5, comment: "Tuyệt vời, sẽ ủng hộ dài dài.", created_at: "2024-12-02 20:41" },
    { id: 4, user_name: "Phạm Minh D", rating: 3, comment: "Vị hơi mặn so với khẩu vị của mình.", created_at: "2024-11-29 12:05" }
];


export default function RestaurantPage() {
    const { slugAndId } = useParams();
    const { user } = useAuth();
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState('');
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    const publicId = (slugAndId || '').includes('-')
        ? (slugAndId || '').split('-').pop()
        : slugAndId;


   useEffect(() => {
        const fetchRestaurantDetail = async () => {
            try {
                setLoading(true);
                // 3. Gọi API thực tế từ backend
                const data = await restaurantApi.getById(publicId);
                const dataWithMockReviews = {
                    ...data,
                    reviews: MOCK_REVIEWS // Dùng dữ liệu giả ở đây
                };
                setRestaurant(dataWithMockReviews);
                
                // Set category mặc định là loại đầu tiên nếu có menu
                if (data.menu && data.menu.length > 0) {
                    const firstCategory = data.menu
                        .map((item) => item.category)
                        .filter((category) => category)[0];
                    setActiveCategory(firstCategory || '');
                }
            } catch (err) {
                console.error("Lỗi fetch nhà hàng:", err);
                setError("Không thể tải dữ liệu nhà hàng. Vui lòng thử lại sau.");
            } finally {
                setLoading(false);
            }
        };

        if (publicId) {
            fetchRestaurantDetail();
        }
    }, [publicId]);

    if (loading) return <div className={styles.loadingContainer}>Đang tải dữ liệu nhà hàng...</div>;
    if (error) return <div className={styles.errorContainer}>{error}</div>;
    if (!restaurant) return <div className={styles.errorContainer}>Không tìm thấy nhà hàng này.</div>;

    const avgRating = (restaurant.reviews.reduce((acc, rev) => acc + rev.rating, 0) / restaurant.reviews.length).toFixed(1);

    const groupedMenu = (restaurant.menu || []).reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});
    
    const categories = Object.keys(groupedMenu);

    const resolveUserExternalId = (currentUser) =>
        currentUser?.externalId ||
        currentUser?.userExternalId ||
        currentUser?.user_id ||
        currentUser?.id ||
        currentUser?.username;

    const handleAddToCart = async (item) => {
        const userExternalId = resolveUserExternalId(user);
        const itemId = item?._id ?? item?.itemId;

        if (!userExternalId || !itemId) {
            window.alert('Vui lòng đăng nhập để thêm món vào giỏ.');
            return;
        }

        try {
            await cartApi.addItem({ userExternalId, itemId, quantity: 1 });
            const cartResponse = await cartApi.getCart({ userExternalId });
            const payload = cartResponse?.data ?? cartResponse;
            const data = payload?.data ?? payload ?? {};
            const totalItems = data.totalItems || 0;
            window.dispatchEvent(new CustomEvent('cart:updated', { detail: { totalItems } }));
        } catch (err) {
            console.error('Add to cart failed:', err);
            window.alert('Không thể thêm món vào giỏ. Vui lòng thử lại.');
        }
    };

    const maskUserName = (name) => {
        if (!name) return 'Ẩn danh';
        const [first] = name.trim().split(' ');
        if (!first) return 'Ẩn danh';
        return `${first.slice(0, 3)}***`;
    };

    const formatReviewTime = (value) => {
        if (!value) return '';
        const normalized = String(value).replace(' ', 'T');
        const parsed = new Date(normalized);
        if (Number.isNaN(parsed.getTime())) return '';
        const day = String(parsed.getDate()).padStart(2, '0');
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const year = parsed.getFullYear();
        const hours = String(parsed.getHours()).padStart(2, '0');
        const minutes = String(parsed.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    return (
        <div className={styles.restaurantPage}>
            <Header />
            
            <div className={styles.pageBody}>
                <Sidebar />
                <main className={styles.mainContent}>
                    {/* Phần Banner */}
                    <section className={styles.heroSection}>
                        <img src={restaurant.images[0]} alt={restaurant.name} className={styles.heroBgImg} />
                        <div className={styles.heroOverlay}>
                            <div className={styles.heroInfo}>
                                <h1 className={styles.heroTitle}>{restaurant.name}</h1>
                                <div className={styles.heroMetaRow}>
                                    <MapPin size={22} />
                                    <span>{restaurant.address?.full || 'Chưa có địa chỉ'}</span>
                                </div>
                                <div className={styles.heroMetaRow}>
                                    <Clock size={18} />
                                    <span>
                                        {restaurant.openTime || '--:--'} - {restaurant.closeTime || '--:--'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className={styles.heroRatingBtn}
                                    onClick={() => setIsReviewOpen(true)}
                                >
                                    <span className={styles.heroRatingValue}>{avgRating}</span>
                                    <Star size={16} fill="#ffffff" color="#ffffff" />
                                    <span className={styles.heroRatingCount}>({restaurant.reviews.length} reviews)</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    <div className={styles.twoColumnLayout}>
                        {/* CỘT TRÁI: Danh mục */}
                        <aside className={styles.columnLeft}>
                            <MenuSidebar 
                                categories={categories} 
                                activeCategory={activeCategory} 
                                onCategoryClick={setActiveCategory}
                            />
                        </aside>

                        {/* CỘT PHẢI: Món ăn */}
                        <section className={styles.columnRight}>
                            <MenuItemsList groupedMenu={groupedMenu} onAddToCart={handleAddToCart} />
                        </section>
                    </div>
                </main>
            </div>

            {isReviewOpen && (
                <div className={styles.modalBackdrop} role="presentation" onClick={() => setIsReviewOpen(false)}>
                    <div
                        className={styles.reviewModal}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Restaurant reviews"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <h3>Đánh giá ({restaurant.reviews.length})</h3>
                            <button
                                type="button"
                                className={styles.modalCloseBtn}
                                onClick={() => setIsReviewOpen(false)}
                                aria-label="Close reviews"
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            {restaurant.reviews.map((review) => (
                                <div key={review.id} className={styles.reviewItem}>
                                    <div className={styles.reviewTitleRow}>
                                        <span className={styles.reviewUser}>{maskUserName(review.user_name)}</span>
                                        <span className={styles.reviewRating}>{review.rating}<Star size={16} fill="#ee5335" color="#ee5335" /></span>
                                    </div>
                                    <p className={styles.reviewComment}>{review.comment}</p>
                                    <span className={styles.reviewTime}>
                                        {formatReviewTime(review.created_at)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}