import {useState, useEffect} from 'react';
import Header from '../../components/navigation/Header';
import Sidebar from '../../components/navigation/Sidebar';
import styles from './CategorizedPage.module.css';
import HomeCard from '../../components/display/HomeCard';
import burger from '../../assets/burger.png';
import { useParams } from 'react-router-dom';

const hotPicks = [
    { image: burger, title: "Delicious Burger", rating: 4.5, ratingQuantity: 120, distance: 2.5, deliveryTime: 20, fee: 15, currency: "$" },
    { image: burger, title: "Yummi Burger", rating: 4.5, ratingQuantity: 120, distance: 2.5, deliveryTime: 20, fee: 15, currency: "$" },
    { image: burger, title: "Scrumptuous Burger", rating: 4.5, ratingQuantity: 120, distance: 2.5, deliveryTime: 20, fee: 15, currency: "$" },
    { image: burger, title: "Tasty Burger", rating: 4.5, ratingQuantity: 120, distance: 2.5, deliveryTime: 20, fee: 15, currency: "$" },
    { image: burger, title: "Tasty Burger", rating: 4.5, ratingQuantity: 120, distance: 2.5, deliveryTime: 20, fee: 15, currency: "$" }
];

export default function CategorizedPage() {
    const [selected, setSelected] = useState('');
    const {categoryName} = useParams();

    return (
        <div style={{backgroundColor: '#FFFDFB'}}> 
            <Header />
            <div className={styles.container}>
                <Sidebar />
                <div className={styles.content}>
                    <div className={styles.category}>
                        <h3 style={{marginBottom: '10px'}}>{categoryName}</h3>
                        <div className={styles.categoryFilter}>
                            <div className={styles.filterContainer}>
                                <select className={styles.filterSelection} value={selected} onChange={(e) => setSelected(e.target.value)}>
                                    <option value="apple">Fastest</option>
                                    <option value="banana">Nearest</option>
                                </select>
                            </div>
                            <div className={styles.filterContainer}>
                                <select className={styles.filterSelection} value={selected} onChange={(e) => setSelected(e.target.value)}>
                                    <option value="apple">Lowest to Highest</option>
                                    <option value="banana">Highest to Lowest</option>
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
                            {hotPicks.slice(0, 4).map((item, index) => (
                                <HomeCard key={index} image={item.image} title={item.title} rating={item.rating} ratingQuantity={item.ratingQuantity} distance={item.distance} deliveryTime={item.deliveryTime} fee={item.fee} currency={item.currency} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}