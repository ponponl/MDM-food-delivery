import {useState, useEffect} from 'react';
import Header from '../../components/navigation/Header';
import Sidebar from '../../components/navigation/Sidebar';
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
    const [burgerRestaurants, setBurgerRestaurants] = useState([]);
    const [pizzaRestaurants, setPizzaRestaurants] = useState([]);
    const [comRestaurants, setComRestaurants] = useState([]);
    const [miPhoRestaurants, setMiPhoRestaurants] = useState([]);
    const [banhMiRestaurants, setBanhMiRestaurants] = useState([]);
    const [caPheRestaurants, setCaPheRestaurants] = useState([]);
    const [traSuaRestaurants, setTraSuaRestaurants] = useState([]);
    const [nuocEpRestaurants, setNuocEpRestaurants] = useState([]);
    const [banhNgotRestaurants, setBanhNgotRestaurants] = useState([]);

    useEffect(() => {
        const fetchRestaurant = async () => {
            try{
                const restaurants = await restaurantApi.getAll();
                setRestaurants(restaurants ?? []);
                const burger = await restaurantApi.getAll({ category: "burger" });
                setBurgerRestaurants(burger);
                const pizza = await restaurantApi.getAll({ category: "pizza" });
                setPizzaRestaurants(pizza);
                const com = await restaurantApi.getAll({ category: "com" });
                setComRestaurants(com);
                const miPho = await restaurantApi.getAll({ category: "mi-pho" });
                setMiPhoRestaurants(miPho);
                const banhMi = await restaurantApi.getAll({ category: "banh-mi" });
                setBanhMiRestaurants(banhMi);
                const caPhe = await restaurantApi.getAll({ category: "ca-phe" });
                setCaPheRestaurants(caPhe);
                const traSua = await restaurantApi.getAll({ category: "tra-sua" });
                setTraSuaRestaurants(traSua);
                const nuocEp = await restaurantApi.getAll({ category: "nuoc-ep" });
                setNuocEpRestaurants(nuocEp);
                const banhNgot = await restaurantApi.getAll({ category: "banh-ngot" });
                setBanhNgotRestaurants(banhNgot);
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
                        <h2 style={{marginBottom: '10px'}}>Chào mừng đến với Foodly!</h2>
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
                            <h2 style={{marginBottom: '10px', marginTop: '10px'}}>Nhà hàng nổi bật</h2>
                            <Link to="/dashboard" className={styles.menuSeeAll}>Xem tất cả <ChevronRight size={16} /></Link>
                        </div>
                        <div className={styles.menuCard}>
                            {restaurants.slice(0, 5).map((item, index) => {
                                const displayImage = (Array.isArray(item.images) && item.images.length > 0)
                                ? item.images[0] 
                                : burger;
                                return(
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
                                )
                            })}
                        </div>
                    </div>
                    <div className={styles.menuItems}>
                        <div className={styles.menuLabel}>
                            <h2 style={{marginBottom: '10px', marginTop: '10px'}}>Burger Ngon Bùng Nổ</h2>
                            <Link to="/category/burger" className={styles.menuSeeAll}>Xem tất cả <ChevronRight size={16} /></Link>
                        </div>
                        <div className={styles.menuCard}>
                            {burgerRestaurants.slice(0,5).map((item, index) => {
                                const displayImage = (Array.isArray(item.images) && item.images.length > 0)
                                ? item.images[0] 
                                : burger;
                                return(
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
                                )
                            })}
                        </div>
                    </div>
                    <div className={styles.menuItems}>
                        <div className={styles.menuLabel}>
                            <h2 style={{marginBottom: '10px', marginTop: '10px'}}>Pizza To Chà Bá</h2>
                            <Link to="/category/pizza" className={styles.menuSeeAll}>Xem tất cả <ChevronRight size={16} /></Link>
                        </div>
                        <div className={styles.menuCard}>
                            {pizzaRestaurants.slice(0,5).map((item, index) => {
                                const displayImage = (Array.isArray(item.images) && item.images.length > 0)
                                ? item.images[0] 
                                : burger;
                                return(
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
                                )
                            })}
                        </div>
                    </div>
                    <div className={styles.menuItems}>
                        <div className={styles.menuLabel}>
                            <h2 style={{marginBottom: '10px', marginTop: '10px'}}>Cơm Đủ Thứ Loại</h2>
                            <Link to="/category/com" className={styles.menuSeeAll}>Xem tất cả <ChevronRight size={16} /></Link>
                        </div>
                        <div className={styles.menuCard}>
                            {comRestaurants.slice(0,5).map((item, index) => {
                                const displayImage = (Array.isArray(item.images) && item.images.length > 0)
                                ? item.images[0] 
                                : burger;
                                return(
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
                                )
                            })}
                        </div>
                    </div>
                    <div className={styles.menuItems}>
                        <div className={styles.menuLabel}>
                            <h2 style={{marginBottom: '10px', marginTop: '10px'}}>Mì Phở Hủ Tiếu Thơm Ngon</h2>
                            <Link to="/category/mi-pho" className={styles.menuSeeAll}>Xem tất cả <ChevronRight size={16} /></Link>
                        </div>
                        <div className={styles.menuCard}>
                            {miPhoRestaurants.slice(0,5).map((item, index) => {
                                const displayImage = (Array.isArray(item.images) && item.images.length > 0)
                                ? item.images[0] 
                                : burger;
                                return(
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
                                )
                            })}
                        </div>
                    </div>
                    <div className={styles.menuItems}>
                        <div className={styles.menuLabel}>
                            <h2 style={{marginBottom: '10px', marginTop: '10px'}}>Bánh Mì Chắc Chưa Giòn Đâu</h2>
                            <Link to="/category/banh-mi" className={styles.menuSeeAll}>Xem tất cả <ChevronRight size={16} /></Link>
                        </div>
                        <div className={styles.menuCard}>
                            {banhMiRestaurants.slice(0,5).map((item, index) => {
                                const displayImage = (Array.isArray(item.images) && item.images.length > 0)
                                ? item.images[0] 
                                : burger;
                                return(
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
                                )
                            })}
                        </div>
                    </div>
                    <div className={styles.menuItems}>
                        <div className={styles.menuLabel}>
                            <h2 style={{marginBottom: '10px', marginTop: '10px'}}>Cà Phê Nhâm Nhi</h2>
                            <Link to="/category/ca-phe" className={styles.menuSeeAll}>Xem tất cả <ChevronRight size={16} /></Link>
                        </div>
                        <div className={styles.menuCard}>
                            {caPheRestaurants.slice(0,5).map((item, index) => {
                                const displayImage = (Array.isArray(item.images) && item.images.length > 0)
                                ? item.images[0] 
                                : burger;
                                return(
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
                                )
                            })}
                        </div>
                    </div>
                    <div className={styles.menuItems}>
                        <div className={styles.menuLabel}>
                            <h2 style={{marginBottom: '10px', marginTop: '10px'}}>Trà Sữa Giảm Cân</h2>
                            <Link to="/category/tra-sua" className={styles.menuSeeAll}>Xem tất cả <ChevronRight size={16} /></Link>
                        </div>
                        <div className={styles.menuCard}>
                            {traSuaRestaurants.slice(0,5).map((item, index) => {
                                const displayImage = (Array.isArray(item.images) && item.images.length > 0)
                                ? item.images[0] 
                                : burger;
                                return(
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
                                )
                            })}
                        </div>
                    </div>
                    <div className={styles.menuItems}>
                        <div className={styles.menuLabel}>
                            <h2 style={{marginBottom: '10px', marginTop: '10px'}}>Nước Ép Tươi Sạch</h2>
                            <Link to="/category/nuoc-ep" className={styles.menuSeeAll}>Xem tất cả <ChevronRight size={16} /></Link>
                        </div>
                        <div className={styles.menuCard}>
                            {nuocEpRestaurants.slice(0,5).map((item, index) => {
                                const displayImage = (Array.isArray(item.images) && item.images.length > 0)
                                ? item.images[0] 
                                : burger;
                                return(
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
                                )
                            })}
                        </div>
                    </div>
                    <div className={styles.menuItems}>
                        <div className={styles.menuLabel}>
                            <h2 style={{marginBottom: '10px', marginTop: '10px'}}>Bánh Ngọt Ngậy Tuyệt Đối</h2>
                            <Link to="/category/banh-ngot" className={styles.menuSeeAll}>Xem tất cả <ChevronRight size={16} /></Link>
                        </div>
                        <div className={styles.menuCard}>
                            {banhNgotRestaurants.slice(0,5).map((item, index) => {
                                const displayImage = (Array.isArray(item.images) && item.images.length > 0)
                                ? item.images[0] 
                                : burger;
                                return(
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
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}