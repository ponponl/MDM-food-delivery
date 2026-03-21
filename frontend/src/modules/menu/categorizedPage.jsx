import {useState, useEffect} from 'react';
import Header from '../../components/navigation/Header';
import Sidebar from '../../components/navigation/Sidebar';
import styles from './CategorizedPage.module.css';
import HomeCard from '../../components/display/HomeCard';
import burger from '../../assets/burger.png';
import { useParams } from 'react-router-dom';
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
    'trang-mieng': 'Bánh Ngọt',
};

export default function CategorizedPage() {
    const [selected, setSelected] = useState('');
    const [menuItems, setMenuItems] = useState([]);
    const {categoryName} = useParams();

    useEffect(() => {
        let isMounted = true;

        const fetchMenus = async () => {
            try {
                const restaurants = await restaurantApi.getAll();
                if (!isMounted) {
                    return;
                }

                const items = (restaurants ?? []).flatMap((restaurant) =>
                    (restaurant.menu ?? []).map((item) => ({
                        ...item,
                        restaurantName: restaurant.name
                    }))
                );

                const normalizedCategory = normalize(categoryName);
                const filteredItems = normalizedCategory
                    ? items.filter((item) => normalize(item.category).includes(normalizedCategory))
                    : items;

                setMenuItems(filteredItems);
            } catch (error) {
                console.log('Không thể tải danh sách món ăn', error);
                setMenuItems([]);
            }
        };

        fetchMenus();

        return () => {
            isMounted = false;
        };
    }, [categoryName]);

    return (
        <div style={{backgroundColor: '#FFFDFB'}}> 
            <Header />
            <div className={styles.container}>
                <Sidebar />
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
                            {menuItems.map((item, index) => {
                                const displayImage = (Array.isArray(item.images) && item.images.length > 0)
                                    ? item.images[0]
                                    : burger;
                                const priceText = typeof item.price === 'number'
                                    ? `${item.price.toLocaleString('en-US')} VND`
                                    : 'Liên hệ';

                                return (
                                    <HomeCard
                                        key={item.itemId ?? `${item.name}-${index}`}
                                        image={displayImage}
                                        title={item.name}
                                        rating={5}
                                        ratingQuantity={0}
                                        distance={0}
                                        deliveryTime={0}
                                        fee={0}
                                        currency={''}
                                        feeText={priceText}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}