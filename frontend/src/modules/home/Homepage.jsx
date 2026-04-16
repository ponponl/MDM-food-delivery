import {User, MapPin, ArrowRight, Navigation} from 'lucide-react';
import { useState, useRef } from 'react';
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
import axios from 'axios';

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
    const [suggestions, setSuggestions] = useState([]);
    const navigate = useNavigate();
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const typingTimeoutRef = useRef(null);

    // const handleSubmit = (e) => {
    //     e.preventDefault();
    //     if (address.trim() !== ''){
    //         updateAddress(address);
    //         navigate('/');
    //     }
    //     console.log('Đã gửi địa chỉ:', address);
    // };

    const selectSuggestion = (suggestion) => {
        const lng = parseFloat(suggestion.lon);
        const lat = parseFloat(suggestion.lat);

        updateAddress({
            fullAddress: suggestion.display_name,
            location: { type: 'Point', coordinates: [lng, lat] }
        });
        setAddress(suggestion.display_name.split(',')[0]);
        setSuggestions([]);
        setActiveSuggestionIndex(-1);
    };

    const handleKeyDown = (e) => {
        // Nếu không có gợi ý nào thì không làm gì
        if (suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            // Nhấn xuống: tăng index
            setActiveSuggestionIndex((prev) => 
                prev < suggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === "ArrowUp") {
            // Nhấn lên: giảm index
            setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === "Enter") {
            // Nhấn Enter: Nếu đang chọn một gợi ý thì chốt gợi ý đó
            if (activeSuggestionIndex >= 0) {
                e.preventDefault(); // Ngăn form submit ngay lập tức
                handleSelectSuggestion(suggestions[activeSuggestionIndex]);
            }
        } else if (e.key === "Escape") {
            // Nhấn Esc: Đóng danh sách
            setSuggestions([]);
            setActiveSuggestionIndex(-1);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (address.trim() !== '') {
            updateAddress({
                fullAddress: address,
                location: { type: 'Point', coordinates: [0, 0] } 
            });
            navigate('/');
        }
    };

    const handleInputChange = async (e) => {
        const value = e.target.value;
        setAddress(value);
        setActiveSuggestionIndex(-1);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        if (value.length > 2) {
            typingTimeoutRef.current = setTimeout(async () => {
                const LIQ_KEY = import.meta.env.VITE_LOCATIONIQ_TOKEN;
                try {
                    const res = await axios.get(
                        `https://api.locationiq.com/v1/autocomplete?key=${LIQ_KEY}&q=${value}&limit=5&dedupe=1&countrycodes=vn&accept-language=vi`
                    );
                    setSuggestions(res.data);
                } catch (err) {
                    console.error("LocationIQ Error:", err);
                }
            }, 500);
        } else {
            setSuggestions([]);
        }
    };

    const handleSelectSuggestion = async (suggestion) => {
        const lng = parseFloat(suggestion.lon);
        const lat = parseFloat(suggestion.lat);

        updateAddress({
            fullAddress: suggestion.display_name,
            location: { 
                type: 'Point', 
                coordinates: [lng, lat] 
            }
        });
    
        // Hiển thị tên ngắn gọn lên input (ví dụ: lấy phần đầu của địa chỉ)
        setAddress(suggestion.display_name.split(',')[0]); 
        setSuggestions([]);
        setActiveSuggestionIndex(-1);
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) return alert("Browser does not support geolocation");

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const LIQ_KEY = import.meta.env.VITE_LOCATIONIQ_TOKEN;

            try {
                const res = await axios.get(`https://us1.locationiq.com/v1/reverse?key=${LIQ_KEY}&lat=${latitude}&lon=${longitude}&format=json`);
                const displayAddr = res.data.display_name;

                updateAddress({
                    fullAddress: displayAddr,
                    location: { type: 'Point', coordinates: [longitude, latitude] }
                });
                setAddress(displayAddr);
            } catch (error) {
                console.error("Location error", error);
            }
        });
    };

    return (
        <div className={styles.homePage}>
            <Header />
            <div className={styles.banner}>
                <img src={homeBanner} className={styles.bgImg} />
                <div className={styles.bannerContent}>
                    <h3>FOODLY</h3>
                    <h1>MÓN NGON, GIAO NHANH</h1>
                    <div className={styles.searchContainer}>
                        <form className={styles.addressInput} onSubmit={handleSubmit}>
                            <MapPin size={18} />
                            <input 
                                className={styles.inputField}
                                type="text" 
                                placeholder="Nhập địa chỉ giao hàng" 
                                value={address}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                            />
                            {/* Nút định vị */}
                            <button type="button" className={styles.detectBtn} onClick={handleDetectLocation}>
                                <Navigation size={18} color="#FF6B35" />
                            </button>
                            
                            <button className={styles.inputBtn} type="submit">
                                <ArrowRight size={18} color="white"/>
                            </button>
                        </form>

                        {/* HIỂN THỊ GỢI Ý ĐỊA CHỈ */}
                        {suggestions.length > 0 && (
                            <ul className={styles.suggestionList}>
                                {suggestions.map((s, index) => (
                                    <li key={s.place_id ||index} onClick={() => handleSelectSuggestion(s)} className={index === activeSuggestionIndex ? styles.activeSuggestion : ''}>
                                        <strong>{s.display_place || s.display_name.split(',')[0]}</strong>
                                        <p>{s.display_name}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
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