import {User, MapPin, ArrowRight} from 'lucide-react';
import { useState } from 'react';
import styles from './Homepage.module.css';
import homeBanner from '../../assets/home-banner.png';
import Header from '../../components/Header';
import MenuPage from './MenuPage';

const CARDS = [
    {
        emoji: '\uD83D\uDEB5',
        title: 'Become a Dasher',
        desc: 'Earn money delivering food on your own schedule. Sign up in minutes and start earning today.',
        link: 'Start earning →',
        bg: 'linear-gradient(135deg, #fff0ee 0%, #ffd6ce 100%)',
    },
    {
        emoji: '\uD83C\uDFEA',
        title: 'Become a Merchant',
        desc: 'Attract new customers and grow your sales. Start with 0% commission for the first 30 days.',
        link: 'Sign up your restaurant →',
        bg: 'linear-gradient(135deg, #e8f8f9 0%, #c8eeef 100%)',
    },
    {
        emoji: '\uD83D\uDCF1',
        title: 'Get the best experience',
        desc: 'Discover the best your neighborhood has to offer, all in one app. Download Foodly now.',
        link: 'Get the app →',
        bg: 'linear-gradient(135deg, #f0f0ff 0%, #dde0ff 100%)',
    },
];

const STATS = [
    { number: '37M+',  label: 'Customers served' },
    { number: '700K+', label: 'Restaurant partners' },
    { number: '7M+',   label: 'Delivery drivers' },
];

function HomeWithoutAddress() {
    const [address, setAddress] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Submitted address:', address);
    };

    return (
        <div className={styles.homePage}>
            <Header />
            <div className={styles.banner}>
                <img src={homeBanner} className={styles.bgImg} />
                <div className={styles.bannerContent}>
                    <h3>FOODLY</h3>
                    <h1>GOOD FOOD, FAST DELIVERY</h1>
                    <form className={styles.addressInput} onSubmit={handleSubmit}>
                        <MapPin size={18} />
                        <input 
                            className={styles.inputField}
                            type="text" 
                            placeholder="Enter delivery address" 
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                        <button className={styles.inputBtn} type="submit"><ArrowRight size={18} color="white"/></button>
                    </form>
                    <button className={styles.addressBtn}><User size={18}/><span>Sign in for saved address</span></button>
                </div>
            </div>

            <section className={styles.cardsSection}>
                <div className={styles.cards}>
                    {CARDS.map((c) => (
                        <div key={c.title} className={styles.card}>
                            <div className={styles.cardIllustration} style={{ background: c.bg }}>
                                {c.emoji}
                            </div>
                            <h3 className={styles.cardTitle}>{c.title}</h3>
                            <p className={styles.cardDesc}>{c.desc}</p>
                            <a href="#" className={styles.cardLink}>{c.link}</a>
                        </div>
                    ))}
                </div>
            </section>

            <div className={styles.statsStrip}>
                <div className={styles.statsInner}>
                    {STATS.map((s) => (
                        <div key={s.label}>
                            <div className={styles.statNumber}>{s.number}</div>
                            <div className={styles.statLabel}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <footer className={styles.footer}>
                © 2026 <span>Foodly</span> — Delivering happiness, one meal at a time.
            </footer>
        </div>
    );
}

export default function Homepage (){
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [hasAdrress, setHasAddress] = useState(true);

    return (
        <div>
            {hasAdrress ? <MenuPage /> : <HomeWithoutAddress />}
        </div>
    )
}