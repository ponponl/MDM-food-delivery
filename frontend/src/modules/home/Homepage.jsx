import {User, MapPin, ArrowRight} from 'lucide-react';
import { useState } from 'react';
import styles from './Homepage.module.css';
import homeBanner from '../../assets/home-banner.png';
import Header from '../../components/header/Header.jsx';
import {AddressContext} from '../../context/AddressContext.jsx';
import Footer from '../../components/footer/Footer.jsx';
import MenuPage from '../menu/menuPage.jsx';
import ClientLayout from '../../layouts/ClientLayout/ClientLayout.jsx';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CARDS = [
    {
        emoji: '\uD83D\uDEB5',
        title: 'Trở thành tài xế giao hàng',
        desc: 'Kiếm tiền giao đồ ăn theo lịch trình của bạn. Đăng ký trong vài phút và bắt đầu kiếm thu nhập ngay hôm nay.',
        link: 'Bắt đầu kiếm tiền →',
        bg: 'linear-gradient(135deg, #fff0ee 0%, #ffd6ce 100%)',
    },
    {
        emoji: '\uD83C\uDFEA',
        title: 'Trở thành đối tác nhà hàng',
        desc: 'Thu hút khách hàng mới và tăng doanh số. Hoa hồng 0% trong 30 ngày đầu.',
        link: 'Đăng ký nhà hàng →',
        bg: 'linear-gradient(135deg, #e8f8f9 0%, #c8eeef 100%)',
    },
    {
        emoji: '\uD83D\uDCF1',
        title: 'Trải nghiệm tốt nhất',
        desc: 'Khám phá những gì tuyệt nhất quanh bạn trong một ứng dụng. Tải Foodly ngay.',
        link: 'Tải ứng dụng →',
        bg: 'linear-gradient(135deg, #f0f0ff 0%, #dde0ff 100%)',
    },
];

const STATS = [
    { number: '37M+',  label: 'Khách hàng đã phục vụ' },
    { number: '700K+', label: 'Đối tác nhà hàng' },
    { number: '7M+',   label: 'Tài xế giao hàng' },
];

function HomeWithoutAddress() {
    const [address, setAddress] = useState('');
    const {updateAddress} = useContext(AddressContext);
    const { user, logoutUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (address.trim() !== ''){
            updateAddress(address);
            navigate('/');
        }
        console.log('Đã gửi địa chỉ:', address);
    };

    return (
        <div className={styles.homePage}>
            <Header />
            <div className={styles.banner}>
                <img src={homeBanner} className={styles.bgImg} />
                <div className={styles.bannerContent}>
                    <h3>FOODLY</h3>
                    <h1>MÓN NGON, GIAO NHANH</h1>
                    <form className={styles.addressInput} onSubmit={handleSubmit}>
                        <MapPin size={18} />
                        <input 
                            className={styles.inputField}
                            type="text" 
                            placeholder="Nhập địa chỉ giao hàng" 
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                        <button className={styles.inputBtn} type="submit"><ArrowRight size={18} color="white"/></button>
                    </form>
                    {user ? (<p className={styles.paraAdrress}>Chưa có địa chỉ - nhập địa chỉ để tiếp tục mua sắm</p>) 
                        : (                    
                        <button className={styles.addressBtn} onClick={() => navigate('/auth')}><User size={18}/><span>Đăng nhập để dùng địa chỉ đã lưu</span></button>
                    )}
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

            <Footer />
        </div>
    );
}

export default function Homepage (){
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const {address} = useContext(AddressContext);

    return address ? (
        <ClientLayout>
            <MenuPage />
        </ClientLayout>
    ) : (
        <HomeWithoutAddress />
    );
}