import {useState, useEffect} from 'react';
import Header from '../../components/navigation/Header';
import Sidebar from '../../components/navigation/Sidebar';
import styles from './MenuPage.module.css';
import { HamburgerIcon, PizzaIcon, BowlFoodIcon, BowlSteamIcon, CoffeeIcon, CakeIcon, PintGlassIcon, OrangeIcon, BreadIcon } from "@phosphor-icons/react";
import CategoryTag from '../../components/display/CategoryTag';
import HomeCard from '../../components/display/HomeCard';
import burger from '../../assets/burger.png';
import pizzaImg from '../../assets/pizza.png';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SmallBanner from '../../components/decoration/SmallBanner';
import restaurantApi from '../../api/restaurantApi.js';

const categories = [
    { icon: <HamburgerIcon size={18}/>, label: "Burger", slug: "burger" },
    { icon: <PizzaIcon size={18}/>, label: "Pizza", slug: "pizza" },
    { icon: <BowlFoodIcon size={18}/>, label: "Cơm", slug: "com" },
    { icon: <BowlSteamIcon size={18}/>, label: "Mì & Phở", slug: "mi-pho" },
    { icon: <BreadIcon size={18}/>, label: "Bánh Mì", slug: "banh-mi" },
    { icon: <CoffeeIcon size={18}/>, label: "Cà Phê", slug: "ca-phe" },
    { icon: <PintGlassIcon size={18}/>, label: "Trà Sữa", slug: "tra-sua" },
    { icon: <OrangeIcon size={18}/>, label: "Nước Ép", slug: "nuoc-ep" },
    { icon: <CakeIcon size={18}/>, label: "Bánh Ngọt", slug: "banh-ngot" }
];

export default function MenuPage() {
    const [restaurants, setRestaurants] = useState([]);

    useEffect(() => {
        const fetchRestaurant = async () => {
            try{
                const data = await restaurantApi.getAll();
                setRestaurants(data);
                console.log("Dữ liệu nhà hàng:", data);
            }catch (error){
                console.log("Không thể tải dữ liệu nhà hàng", error);
            }
        };

        fetchRestaurant();
    }, [])

    return (
        <div style={{backgroundColor: '#FFFDFB'}}> 
            <Header />
            <div className={styles.container}>
                <Sidebar />
                <div className={styles.content}>
                    <div className={styles.category}>
                        <h3 style={{marginBottom: '10px'}}>Chào mừng đến với Foodly!</h3>
                        {categories.map((category, index) => (
                            <Link
                                key={index}
                                to={`/category/${category.slug}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <CategoryTag icon={category.icon} category={category.label} style={{marginLeft: '-10px'}}/>
                            </Link>
                        ))}
                    </div>
                    <div className={styles.menuBanner}>
                        <SmallBanner image={pizzaImg} title={'Ưu đãi mỗi ngày'} description={'Giảm giá cho món bạn yêu thích.'} bgColor={'purple'} textColor={'white'} bannerButton={'Đặt ngay'} bannerPath={'/hotdeal'}/>
                        <SmallBanner image={pizzaImg} title={'Món mới tuần này'} description={'Khám phá hương vị vừa ra mắt.'} bgColor={'green'} textColor={'white'} bannerButton={'Đặt ngay'} bannerPath={'/hotdeal'}/>
                    </div>
                    <div className={styles.menuItems}>
                        <div className={styles.menuLabel}>
                            <h3 style={{marginBottom: '10px', marginTop: '10px'}}>Gợi ý nổi bật</h3>
                            <Link to="/dashboard" className={styles.menuSeeAll}>Xem tất cả <ChevronRight size={16} /></Link>
                        </div>
                        <div className={styles.menuCard}>
                            {restaurants.slice(0, 5).map((item, index) => {
                                console.log("Dữ liệu của 1 nhà hàng:", item);
                                const displayImage = (Array.isArray(item.images) && item.images.length > 0)
                                ? item.images[0] 
                                : burger;
                                return(
                                <HomeCard 
                                    key={index} 
                                    image={displayImage} 
                                    title={item.name} 
                                    rating={5} 
                                    ratingQuantity={120} 
                                    distance={5} 
                                    deliveryTime={6} 
                                    fee={15} 
                                    currency={'$'} />
                                )
                            })}
                        </div>
                    </div>
                    <div className={styles.menuItems}>
                        <div className={styles.menuLabel}>
                            <h3 style={{marginBottom: '10px', marginTop: '10px'}}>Giao nhanh nhất</h3>
                            <Link to="/dashboard" className={styles.menuSeeAll}>Xem tất cả <ChevronRight size={16} /></Link>
                        </div>
                        <div className={styles.menuCard}>
                            {restaurants.slice(0, 5).map((item, index) => {
                                console.log("Dữ liệu của 1 nhà hàng:", item);
                                const displayImage = (Array.isArray(item.images) && item.images.length > 0)
                                ? item.images[0] 
                                : burger;
                                return(
                                <HomeCard 
                                    key={index} 
                                    image={displayImage} 
                                    title={item.name} 
                                    rating={5} 
                                    ratingQuantity={120} 
                                    distance={5} 
                                    deliveryTime={6} 
                                    fee={15} 
                                    currency={'$'} />
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}