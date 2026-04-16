import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContainer}>
                <div className={styles.footerSection}>
                    <h2 className={styles.logo}>Foodly<span>.</span></h2>
                    <p className={styles.slogan}>Mang niềm vui đến từng bữa ăn với những món ngon chất lượng nhất.</p>
                </div>

                <div className={styles.footerSection}>
                    <h4>Khám phá</h4>
                    <ul>
                        <li><Link to="/">Về chúng tôi</Link></li>
                        <li><Link to="/">Thực đơn</Link></li>
                        <li><Link to="/">Tin tức ẩm thực</Link></li>
                    </ul>
                </div>

                <div className={styles.footerSection}>
                    <h4>Kinh doanh</h4>
                    <ul>
                        <li>
                            <Link to="/merchant/register" className={styles.partnerLink}>
                                Đăng ký nhà hàng
                            </Link>
                        </li>
                        <li>
                            <Link to="/merchant/login" className={styles.merchantLoginBtn}>
                                Đăng nhập đối tác
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className={styles.footerSection}>
                    <h4>Liên hệ</h4>
                    <p>Email: hotro@foodly.vn</p>
                    <p>Hotline: 1900 1234</p>
                </div>
            </div>

            <div className={styles.footerBottom}>
                <p>© {new Date().getFullYear()} <span>Foodly</span>. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;