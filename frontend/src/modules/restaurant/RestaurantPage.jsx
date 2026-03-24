import { useContext, useState, useEffect } from 'react';
import { Star, Clock, Users, DollarSign, Plus, MapPin } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Header from '../../components/navigation/Header'; 
import Sidebar from '../../components/navigation/Sidebar';
import MenuSidebar from '../../components/menuSideBar/menuSideBar.jsx';
import ReviewsSection from '../../components/reviewSection/ReviewSection.jsx';
import MenuItemsList from '../../components/menuItemList/MenuItemList.jsx';
import { AddressContext } from '../../context/AddressContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import restaurantApi from '../../api/restaurantApi';
import cartApi from '../../api/cartApi';
import styles from './RestaurantPage.module.css';

const MOCK_REVIEWS = [
    { id: 1, user_name: "Nguyễn Văn A", rating: 5, comment: "Đồ ăn rất ngon, giao hàng nhanh!" },
    { id: 2, user_name: "Trần Thị B", rating: 4, comment: "Pizza còn nóng hổi, tuy nhiên hơi ít phô mai." },
    { id: 3, user_name: "Lê Văn C", rating: 5, comment: "Tuyệt vời, sẽ ủng hộ dài dài." },
    { id: 4, user_name: "Phạm Minh D", rating: 3, comment: "Vị hơi mặn so với khẩu vị của mình." }
];


export default function RestaurantPage() {
    const { slugAndId } = useParams();
    const { user } = useAuth();
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState('Đánh giá');

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
                    setActiveCategory(data.menu[0].category);
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
        } catch (err) {
            console.error('Add to cart failed:', err);
            window.alert('Không thể thêm món vào giỏ. Vui lòng thử lại.');
        }
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
                            <h1>{restaurant.name}</h1>
                        </div>
                    </section>

                    <div className={styles.twoColumnLayout}>
                        {/* CỘT TRÁI: Info & Danh mục */}
                        <aside className={styles.columnLeft}>
                            <div className={styles.restaurantInfoCard}>
                                <h2 className={styles.infoTitle}>Thông tin cửa hàng</h2>
                                
                                {/* Trạng thái hoạt động */}
                                <div className={styles.statusLine}>
                                    <Clock size={18} style={{color: 'black'}}/>
                                    <span>Đang mở cửa</span>
                                </div>

                                {/* Dòng Rating và Khoảng cách */}
                                <div className={styles.infoRow}>
                                    <span className={styles.bold}>{avgRating}</span>
                                    <Star size={16} fill="#4d4d4d" color="#4d4d4d" />
                                    <span className={styles.gray}>({restaurant.reviews.length}+)</span>
                                    <span className={styles.dot}>•</span>
                                    <span>1.1 mi</span>
                                </div>

                                {/* Dòng Giá và Loại hình */}
                                <div className={styles.infoRow}>
                                    <span>$$</span>
                                    <span className={styles.dot}>•</span>
                                    <span>{restaurant.type}</span>
                                </div>
                            </div>

                            <MenuSidebar 
                                categories={categories} 
                                activeCategory={activeCategory} 
                                onCategoryClick={setActiveCategory}
                            />
                        </aside>

                        {/* CỘT PHẢI: Strip, Reviews & Món ăn */}
                        <section className={styles.columnRight}>
                            <div className={styles.infoStrip}>
                                <div className={styles.infoItem}>
                                    <DollarSign size={20} color="#EE5335" />
                                    <div>
                                        <p className={styles.label}>Phí giao hàng</p>
                                        <p className={styles.val}>{restaurant.deliveryFee?.toLocaleString() || 0}đ</p>
                                    </div>
                                </div>
                                <div className={styles.infoItem}>
                                    <Clock size={20} color="#EE5335" />
                                    <div>
                                        <p className={styles.label}>Thời gian</p>
                                        <p className={styles.val}>{restaurant.deliveryTime} phút</p>
                                    </div>
                                </div>
                                <button className={styles.groupBtn}>
                                    <Users size={18} /> Đặt nhóm
                                </button>
                            </div>

                            <ReviewsSection reviews={restaurant.reviews} avgRating={avgRating} />

                            {/* <div className={styles.menuItemsList}>
                                {Object.entries(groupedMenu).map(([category, items]) => (
                                    <div key={category} id={category} className={styles.categorySection}>
                                        <h2 className={styles.categoryTitle}>{category}</h2>
                                        <div className={styles.foodGrid}>
                                            {items.map(item => (
                                                <div key={item._id} className={styles.foodCard}>
                                                    <div className={styles.foodImage}>
                                                        <img src={item.image} alt={item.name} />
                                                        <button className={styles.addBtn}><Plus size={20} color="white" /></button>
                                                    </div>
                                                    <div className={styles.foodInfo}>
                                                        <h4>{item.name}</h4>
                                                        <p>{item.description}</p>
                                                        <span className={styles.price}>{item.price.toLocaleString()}đ</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div> */}
                            <MenuItemsList groupedMenu={groupedMenu} onAddToCart={handleAddToCart} />
                        </section>
                    </div>
                </main>
            </div>
            <footer className={styles.footer}>
                © 2026 <span>Foodly</span> — Mang niềm vui đến từng bữa ăn.
            </footer>
        </div>
    );
}