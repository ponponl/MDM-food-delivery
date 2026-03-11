import {useState, useEffect} from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import styles from './MenuPage.module.css';
import { HamburgerIcon, PizzaIcon, OrangeIcon, PintGlassIcon } from "@phosphor-icons/react";
import CategoryTag from '../../components/CategoryTag';
import HomeCard from '../../components/HomeCard';
import burger from '../../assets/burger.png';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
    { icon: <HamburgerIcon size={18}/>, category: "Burgers" },
    { icon: <PizzaIcon size={18}/>, category: "Pizzas" },
    { icon: <OrangeIcon size={18}/>, category: "Oranges" },
    { icon: <PintGlassIcon size={18}/>, category: "Milktea" }
];

const hotPicks = [
    { image: burger, title: "Delicious Burger", rating: 4.5, ratingQuantity: 120, distance: 2.5, deliveryTime: 20, fee: 15, currency: "$" },
    { image: burger, title: "Yummi Burger", rating: 4.5, ratingQuantity: 120, distance: 2.5, deliveryTime: 20, fee: 15, currency: "$" },
    { image: burger, title: "Scrumptuous Burger", rating: 4.5, ratingQuantity: 120, distance: 2.5, deliveryTime: 20, fee: 15, currency: "$" },
    { image: burger, title: "Tasty Burger", rating: 4.5, ratingQuantity: 120, distance: 2.5, deliveryTime: 20, fee: 15, currency: "$" },
    { image: burger, title: "Tasty Burger", rating: 4.5, ratingQuantity: 120, distance: 2.5, deliveryTime: 20, fee: 15, currency: "$" }
];

const fastest = [
    { image: burger, title: "Delicious Burger", rating: 4.5, ratingQuantity: 120, distance: 2.5, deliveryTime: 20, fee: 15, currency: "$" },
    { image: burger, title: "Yummi Burger", rating: 4.5, ratingQuantity: 120, distance: 2.5, deliveryTime: 20, fee: 15, currency: "$" },
    { image: burger, title: "Scrumptuous Burger", rating: 4.5, ratingQuantity: 120, distance: 2.5, deliveryTime: 20, fee: 15, currency: "$" },
    { image: burger, title: "Tasty Burger", rating: 4.5, ratingQuantity: 120, distance: 2.5, deliveryTime: 20, fee: 15, currency: "$" },
    { image: burger, title: "Tasty Burger", rating: 4.5, ratingQuantity: 120, distance: 2.5, deliveryTime: 20, fee: 15, currency: "$" }
];

export default function MenuPage() {
    return (
        <div style={{backgroundColor: '#FFFDFB'}}> 
            <Header />
            <div className={styles.container}>
                <Sidebar />
                <div className={styles.content}>
                    <div className={styles.category}>
                    <h3 style={{marginBottom: '10px'}}>Welcome to Foodly!</h3>
                    {categories.map((category, index) => 
                        <CategoryTag key={index} icon={category.icon} category={category.category} style={{marginLeft: '-10px'}}/>
                    )}
                    </div>
                    <div className={styles.menuItems}>
                        <div className={styles.menuLabel}>
                            <h3 style={{marginBottom: '10px', marginTop: '10px'}}>Hot pick</h3>
                            <Link to="/dashboard" className={styles.menuSeeAll}>See all <ChevronRight size={16} /></Link>
                        </div>
                        <div className={styles.menuCard}>
                            {hotPicks.slice(0, 4).map((item, index) => (
                                <HomeCard key={index} image={item.image} title={item.title} rating={item.rating} ratingQuantity={item.ratingQuantity} distance={item.distance} deliveryTime={item.deliveryTime} fee={item.fee} currency={item.currency} />
                            ))}
                        </div>
                    </div>
                    <div className={styles.menuItems}>
                        <div className={styles.menuLabel}>
                            <h3 style={{marginBottom: '10px', marginTop: '10px'}}>Fastest Delivery</h3>
                            <Link to="/dashboard" className={styles.menuSeeAll}>See all <ChevronRight size={16} /></Link>
                        </div>
                        <div className={styles.menuCard}>
                            {fastest.slice(0, 4).map((item, index) => (
                                <HomeCard key={index} image={item.image} title={item.title} rating={item.rating} ratingQuantity={item.ratingQuantity} distance={item.distance} deliveryTime={item.deliveryTime} fee={item.fee} currency={item.currency} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}