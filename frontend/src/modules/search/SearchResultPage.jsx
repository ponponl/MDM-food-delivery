import { useState, useEffect } from 'react';
import styles from './SearchResultPage.module.css';
import RestaurantCard from '../../components/display/RestaurantCard.jsx';
import burger from '../../assets/burger.png';
import { useParams, useNavigate } from 'react-router-dom';
import restaurantApi from '../../api/restaurantApi.js';

export default function SearchResultPage() {
    const [selected, setSelected] = useState('');
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { keyword } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;

        const fetchSearchResults = async () => {
            if (!keyword) {
                setRestaurants([]);
                return;
            }

            try {
                setLoading(true);
                setError('');
                // Call the restaurant API with name parameter for search
                const restaurants = await restaurantApi.getAll({ name: decodeURIComponent(keyword) });
                
                if (!isMounted) {
                    return;
                }

                setRestaurants(restaurants ?? []);
            } catch (err) {
                console.error('Search error:', err);
                if (isMounted) {
                    setError('Không thể tải kết quả tìm kiếm');
                    setRestaurants([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchSearchResults();

        return () => {
            isMounted = false;
        };
    }, [keyword]);

    const slugify = (value) => (
        (value ?? '')
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .toLowerCase()
    );

    const handleRestaurantClick = (restaurant) => {
        const publicId = restaurant?.publicId || restaurant?.public_id || restaurant?._id || restaurant?.id;
        if (!publicId) {
            return;
        }

        const slug = restaurant?.slug || slugify(restaurant?.name);
        navigate(`/restaurant/${slug}-${publicId}`);
    };

    return (
        <div style={{ backgroundColor: '#FFFDFB' }}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.searchHeader}>
                        <h3 style={{ marginBottom: '10px' }}>
                            Kết quả tìm kiếm cho "<span style={{ color: 'var(--primary-color)' }}>{decodeURIComponent(keyword)}</span>"
                        </h3>
                    </div>

                    {!loading && restaurants.length > 0 && (
                        <div className={styles.searchFilter}>
                            <div className={styles.filterContainer}>
                                <select className={styles.filterSelection} value={selected} onChange={(e) => setSelected(e.target.value)}>
                                    <option value="">Sắp xếp</option>
                                    <option value="fastest">Nhanh nhất</option>
                                    <option value="nearest">Gần nhất</option>
                                </select>
                            </div>
                            <div className={styles.filterContainer}>
                                <select className={styles.filterSelection} value={selected} onChange={(e) => setSelected(e.target.value)}>
                                    <option value="">Giá</option>
                                    <option value="low-to-high">Giá thấp đến cao</option>
                                    <option value="high-to-low">Giá cao đến thấp</option>
                                </select>
                            </div>
                            <div className={styles.filterContainer}>
                                <select className={styles.filterSelection} value={selected} onChange={(e) => setSelected(e.target.value)}>
                                    <option value="">Đánh giá</option>
                                    <option value="5">5 ★</option>
                                    <option value="4.5">4.5 ★</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className={styles.loading}>
                            <p>Đang tải kết quả...</p>
                        </div>
                    )}

                    {error && (
                        <div className={styles.error}>
                            <p>{error}</p>
                        </div>
                    )}

                    {!loading && restaurants.length === 0 && !error && (
                        <div className={styles.empty}>
                            <p>Không tìm thấy nhà hàng nào phù hợp với từ khóa của bạn</p>
                        </div>
                    )}

                    {!loading && restaurants.length > 0 && (
                        <div className={styles.menuItems}>
                            <div className={styles.menuCard}>
                                {restaurants.map((restaurant, index) => {
                                    console.log("Dữ liệu nhà hàng:", restaurant);
                                    const displayImage = (Array.isArray(restaurant.images) && restaurant.images.length > 0)
                                        ? restaurant.images[0]
                                        : burger;
                                    return (
                                        <RestaurantCard
                                            key={index}
                                            image={displayImage}
                                            title={restaurant.name}
                                            rating={5}
                                            ratingQuantity={120}
                                            distance={5}
                                            deliveryTime={6}
                                            fee={15}
                                            currency={'$'}
                                            onClick={() => handleRestaurantClick(restaurant)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
