import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MenuPage.module.css';
import { HamburgerIcon, PizzaIcon, BowlFoodIcon, BowlSteamIcon, CoffeeIcon, CakeIcon, PintGlassIcon, OrangeIcon, BreadIcon } from "@phosphor-icons/react";
import CategoryTag from '../../components/display/CategoryTag';
import RestaurantCard from '../../components/display/RestaurantCard';
import burger from '../../assets/burger.png';
import pizzaImg from '../../assets/pizza.png';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SmallBanner from '../../components/decoration/SmallBanner';
import restaurantApi from '../../api/restaurantApi.js';
import categoryApi from '../../api/categoryApi.js';
import { useQuery } from '@tanstack/react-query';

const categoryIconMap = {
    HamburgerIcon,
    PizzaIcon,
    BowlFoodIcon,
    BowlSteamIcon,
    BreadIcon,
    CoffeeIcon,
    PintGlassIcon,
    OrangeIcon,
    CakeIcon
};

export default function MenuPage() {
    const navigate = useNavigate();

    const slugify = (value) => (
        (value ?? '')
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .toLowerCase()
    );

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: categoryApi.getAll,
        staleTime: 30 * 60 * 1000
    });

    const { data: restaurantsByCategory = {} } = useQuery({
        queryKey: ['restaurants-summary'],
        queryFn: restaurantApi.getSummary,
        staleTime: 60 * 1000
    });

    const { data: restaurants = [] } = useQuery({
        queryKey: ['restaurants', { limit: 5 }],
        queryFn: () => restaurantApi.getAll({ limit: 5 }),
        staleTime: 60 * 1000
    });

    const sortedCategories = useMemo(() => (
        (categories ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    ), [categories]);

    const handleRestaurantClick = (restaurant) => {
        const publicId = restaurant?.publicId || restaurant?.public_id || restaurant?._id || restaurant?.id;
        if (!publicId) {
            return;
        }

        const slug = restaurant?.slug || slugify(restaurant?.name);
        navigate(`/restaurant/${slug}-${publicId}`);
    };

    return (
        <div style={{backgroundColor: '#FFFDFB'}}> 
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.category}>
                        <h2 style={{marginBottom: '10px'}}>Chào mừng đến với Foodly!</h2>
                        {sortedCategories.map((category, index) => {
                            const IconComponent = categoryIconMap[category.iconKey];
                            const icon = IconComponent ? <IconComponent size={18} /> : null;
                            return (
                            <Link
                                key={index}
                                to={`/category/${category.slug}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <CategoryTag icon={icon} category={category.label} style={{marginLeft: '-10px'}}/>
                            </Link>
                            );
                        })}
                    </div>
                    <div className={styles.menuBanner}>
                        <SmallBanner image={pizzaImg} title={'Ưu đãi mỗi ngày'} description={'Giảm giá cho món bạn yêu thích.'} bgColor={'purple'} textColor={'white'} bannerButton={'Đặt ngay'} bannerPath={'/hotdeal'}/>
                        <SmallBanner image={pizzaImg} title={'Món mới tuần này'} description={'Khám phá hương vị vừa ra mắt.'} bgColor={'green'} textColor={'white'} bannerButton={'Đặt ngay'} bannerPath={'/hotdeal'}/>
                    </div>
                    <div className={styles.menuItems}>
                        <div className={styles.menuLabel}>
                            <h2 style={{marginBottom: '10px', marginTop: '10px'}}>Nhà hàng nổi bật</h2>
                            <Link to="/dashboard" className={styles.menuSeeAll}>Xem tất cả <ChevronRight size={16} /></Link>
                        </div>
                        <div className={styles.menuCard}>
                            {restaurants.slice(0, 5).map((item, index) => {
                                const displayImage = (Array.isArray(item.images) && item.images.length > 0)
                                ? item.images[0] 
                                : burger;
                                return(
                                    <div
                                        key={item._id || index} 
                                        onClick={() => handleRestaurantClick(item)}
                                        className={styles.cardWrapper}
                                    >
                                        <RestaurantCard 
                                            image={displayImage} 
                                            title={item.name} 
                                            rating={5} 
                                            ratingQuantity={120} 
                                            distance={5} 
                                            deliveryTime={6} 
                                            fee={15} 
                                            currency={'$'} 
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    {sortedCategories.map((category) => {
                        const items = restaurantsByCategory[category.slug] ?? [];
                        return (
                            <div className={styles.menuItems} key={category.slug}>
                                <div className={styles.menuLabel}>
                                    <h2 style={{marginBottom: '10px', marginTop: '10px'}}>{category.displayName}</h2>
                                    <Link to={`/category/${category.slug}`} className={styles.menuSeeAll}>Xem tất cả <ChevronRight size={16} /></Link>
                                </div>
                                <div className={styles.menuCard}>
                                    {items.slice(0,5).map((item, index) => {
                                        const displayImage = (Array.isArray(item.images) && item.images.length > 0)
                                        ? item.images[0] 
                                        : burger;
                                        return(
                                            <div
                                                key={item._id || index} 
                                                onClick={() => handleRestaurantClick(item)}
                                                className={styles.cardWrapper}
                                            >
                                                <RestaurantCard 
                                                    key={index} 
                                                    image={displayImage} 
                                                    title={item.name} 
                                                    rating={5} 
                                                    ratingQuantity={120} 
                                                    distance={5} 
                                                    deliveryTime={6} 
                                                    fee={15} 
                                                    currency={'$'} />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}