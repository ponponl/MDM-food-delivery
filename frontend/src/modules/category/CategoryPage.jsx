import {useState, useEffect} from 'react';
import styles from './CategoryPage.module.css';
import RestaurantCard from '../../components/display/RestaurantCard.jsx';
import burger from '../../assets/burger.png';
import { useParams, useNavigate } from 'react-router-dom';
import restaurantApi from '../../api/restaurantApi.js';

const normalize = (value) => (
    (value ?? '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .toLowerCase()
);

const CATEGORY_LABELS = {
    'burger': 'Burger',
    'pizza': 'Pizza',
    'com': 'Cơm',
    'mi-pho': 'Mì & Phở',
    'banh-mi': 'Bánh Mì',
    'ca-phe': 'Cà Phê',
    'tra-sua': 'Trà Sữa',
    'nuoc-ep': 'Nước Ép',
    'banh-ngot': 'Bánh Ngọt',
};

export default function CategoryPage() {
    const [selected, setSelected] = useState('');
    const [restaurants, setRestaurants] = useState([]);
    const {categoryName} = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;

        const fetchMenus = async () => {
            try {
                const restaurants = await restaurantApi.getAll({ category: categoryName });
                if (!isMounted) {
                    return;
                }

                setRestaurants(restaurants ?? []);
            } catch (error) {
                console.log('Không thể tải danh sách món ăn', error);
                setRestaurants([]);
            }
        };

        fetchMenus();

        return () => {
            isMounted = false;
        };
    }, [categoryName]);

    const slugify = (value) => (
        (value ?? '')
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[đĐ]/g, 'd')
            .replace(/[^a-zA-Z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .toLowerCase()
    );

    const handleRestaurantClick = (restaurant) => {
        const publicId = restaurant?.publicId || restaurant?.public_id || restaurant?._id || restaurant?.id;
        if (!publicId) {
            return;
        }

        const slug = slugify(restaurant?.name);
        navigate(`/restaurant/${slug}-${publicId}`);
    };

    return (
        <div style={{backgroundColor: '#FFFDFB'}}> 
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.category}>
                        <h3 style={{marginBottom: '10px'}}>{CATEGORY_LABELS[normalize(categoryName)] ?? categoryName}</h3>
                        <div className={styles.categoryFilter}>
                            <div className={styles.filterContainer}>
                                <select className={styles.filterSelection} value={selected} onChange={(e) => setSelected(e.target.value)}>
                                    <option value="apple">Nhanh nhất</option>
                                    <option value="banana">Gần nhất</option>
                                </select>
                            </div>
                            <div className={styles.filterContainer}>
                                <select className={styles.filterSelection} value={selected} onChange={(e) => setSelected(e.target.value)}>
                                    <option value="apple">Giá thấp đến cao</option>
                                    <option value="banana">Giá cao đến thấp</option>
                                </select>
                            </div>
                            <div className={styles.filterContainer}>
                                <select className={styles.filterSelection} value={selected} onChange={(e) => setSelected(e.target.value)}>
                                    <option value="apple">5 ★</option>
                                    <option value="banana">4.5 ★</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className={styles.menuItems}>
                        <div className={styles.menuCard}>
                            {restaurants.slice(0, 5).map((item, index) => {
                                console.log("Dữ liệu của 1 nhà hàng:", item);
                                const displayImage = (Array.isArray(item.images) && item.images.length > 0)
                                    ? item.images[0]
                                    : burger;
                                return(
                                <RestaurantCard 
                                    key={index} 
                                    image={displayImage} 
                                    title={item.name} 
                                    rating={item.rating ?? item.avgRating ?? 0} 
                                    ratingQuantity={item.ratingCount ?? item.totalReview ?? 0} 
                                    distance={5} 
                                    deliveryTime={6} 
                                    fee={15} 
                                    currency={'$'}
                                    onClick={() => handleRestaurantClick(item)} />
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}