import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Star, Clock, MapPin } from 'lucide-react';
import { useParams } from 'react-router-dom';
import MenuSidebar from '../../components/menuSideBar/menuSideBar.jsx';
import MenuItemsList from '../../components/menuItemList/MenuItemList.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import restaurantApi from '../../api/restaurantApi';
import cartApi from '../../api/cartApi';
import reviewApi from '../../api/reviewApi';
import styles from './RestaurantPage.module.css';
import { toast } from 'react-hot-toast';

export default function RestaurantPage() {
    const navigate = useNavigate();
    const { slugAndId } = useParams();
    const { user } = useAuth();
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState('');

    const publicId = (slugAndId || '').includes('-')
        ? (slugAndId || '').split('-').pop()
        : slugAndId;

    const handleViewReviews = () => {
        navigate(`/restaurant/${publicId}/reviews`, { 
            state: { 
                restaurantName: restaurant.name
            } 
        });
    };

   useEffect(() => {
        const fetchRestaurantDetail = async () => {
            try {
                setLoading(true);
                const [data, reviewsResponse] = await Promise.all([
                    restaurantApi.getById(publicId),
                    reviewApi.getReviewsByRestaurantId(publicId).catch(() => []) 
                ]);
                
                const realReviews = reviewsResponse?.data || reviewsResponse || [];
                
                setRestaurant({
                    ...data,
                    reviews: realReviews
                });
                
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

    if (loading || error || !restaurant) return null;

    const totalReviews = restaurant.reviews?.length || 0;
    const avgRating = totalReviews > 0 
        ? (restaurant.reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews).toFixed(1)
        : '0.0';

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
        const itemId = item?._id ?? item?.itemId;

        if (!user || !itemId) {
            toast.error('Vui lòng đăng nhập để thêm món vào giỏ.');
            return;
        }

        const optimisticDelta = 1;
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: { deltaQty: optimisticDelta } }));

        try {
            const response = await cartApi.addItem({
                itemId,
                quantity: optimisticDelta,
                restaurantPublicId: publicId,
                options: item?.options || [],
                note: null
            });
            const payload = response?.data ?? response;
            const data = payload?.cart ?? payload?.data ?? payload ?? {};
            const totalQty = typeof data.totalQty === 'number' ? data.totalQty : null;
            if (typeof totalQty === 'number') {
                window.dispatchEvent(new CustomEvent('cart:updated', { detail: { totalQty } }));
            } else {
                window.dispatchEvent(new CustomEvent('cart:updated', { detail: {} }));
            }
            toast.success('Đã thêm món vào giỏ hàng.');
        } catch (err) {
            window.dispatchEvent(new CustomEvent('cart:updated', { detail: { deltaQty: -optimisticDelta } }));
            console.error('Add to cart failed:', err);
            toast.error('Không thể thêm món vào giỏ. Vui lòng thử lại.');
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
            <main className={styles.mainContent}>
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
                                onClick={handleViewReviews}
                            >
                                <span className={styles.heroRatingValue}>{avgRating}</span>
                                <Star size={16} fill="#ffffff" color="#ffffff" />
                                <span className={styles.heroRatingCount}>({restaurant.reviews.length} reviews)</span>
                            </button>
                        </div>
                    </div>
                </section>

                <div className={styles.twoColumnLayout}>
                    <aside className={styles.columnLeft}>
                        <MenuSidebar 
                            categories={categories} 
                            activeCategory={activeCategory} 
                            onCategoryClick={setActiveCategory}
                        />
                    </aside>

                    <section className={styles.columnRight}>
                        <MenuItemsList groupedMenu={groupedMenu} onAddToCart={handleAddToCart} />
                    </section>
                </div>
            </main>

        </div>
    );
}