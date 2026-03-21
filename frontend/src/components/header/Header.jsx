import { useState, useEffect } from 'react';
import { ShoppingCart, Settings } from 'lucide-react';
import styles from './Header.module.css';

const Header = () => {
    return (
        <header className={styles.header}>
            <div className={styles.logo}>Foodly</div>
            <div className={styles.nav}>
                <span className={styles.navItem}>Trang chủ</span>
                <span className={styles.navItem}>Thực đơn</span>
                <span className={styles.navItem}>Giới thiệu</span>
                <span className={styles.navItem}>Liên hệ</span>
            </div>
            <div className={styles.actionButtons}>
                <button className={styles.cartButton}><ShoppingCart size={18} /></button>
                <button className={styles.settingsButton}><Settings size={18} /></button>
            </div>
            <div className={styles.authButtons}>
                <button className={styles.loginButton}>Đăng nhập</button>
                <button className={styles.signupButton}>Đăng ký</button>
            </div>
        </header>
    )
};

export default Header;