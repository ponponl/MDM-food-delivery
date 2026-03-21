import { useState, useEffect } from 'react';
import { ShoppingCart, Settings } from 'lucide-react';
import styles from './Header.module.css';

const Header = () => {
    return (
        <header className={styles.header}>
            <div className={styles.logo}>Foodly</div>
            <div className={styles.nav}>
                <span className={styles.navItem}>Home</span>
                <span className={styles.navItem}>Menu</span>
                <span className={styles.navItem}>About</span>
                <span className={styles.navItem}>Contact</span>
            </div>
            <div className={styles.actionButtons}>
                <button className={styles.cartButton}><ShoppingCart size={18} /></button>
                <button className={styles.settingsButton}><Settings size={18} /></button>
            </div>
            <div className={styles.authButtons}>
                <button className={styles.loginButton}>Login</button>
                <button className={styles.signupButton}>Sign Up</button>
            </div>
        </header>
    )
};

export default Header;