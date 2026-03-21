import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContent}>
                <div className={styles.logo}>Foodly</div>
                <div className={styles.links}>
                    <span className={styles.linkItem}>Home</span>
                    <span className={styles.linkItem}>Menu</span>
                    <span className={styles.linkItem}>About</span>
                    <span className={styles.linkItem}>Contact</span>
                </div>
                <div className={styles.contactInfo}>
                    <p>Email:
                        <a href="mailto: foodly@service.com">foodly@service.com</a>
                    </p>
                    <p>Phone: <a href="tel:+1234567890">+1 (234) 567-890</a></p>
                    <p>Address: 123 Foodly St, Flavor Town, USA</p>
                </div>
                <div className={styles.socialMedia}>
                    <a href="https://www.facebook.com/foodly" target="_blank" rel="noopener noreferrer">Facebook</a>
                    <a href="https://www.twitter.com/foodly" target="_blank" rel="noopener noreferrer">Twitter</a>
                    <a href="https://www.instagram.com/foodly" target="_blank" rel="noopener noreferrer">Instagram</a>
                </div>
            </div>
            <div className={styles.copyRight}>
                &copy; {new Date().getFullYear()} Foodly. All rights reserved.
            </div>
        </footer>
    )
};

export default Footer;