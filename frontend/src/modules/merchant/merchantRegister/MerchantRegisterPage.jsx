import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { registerMerchant } from '../../../services/authService';
import MapPicker from '../../../components/mapPicker/MapPicker';
import { useAddressSearch } from '../../../hooks/useAddressSearch';
import { MapPin, User, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, LoaderCircle, Check, Navigation } from 'lucide-react';
import styles from './MerchantRegisterPage.module.css';

const CATEGORIES = [
  { value: 'burger', label: 'Burger' },
  { value: 'pizza', label: 'Pizza' },
  { value: 'com', label: 'Cơm' },
  { value: 'mi-pho', label: 'Mì & Phở' },
  { value: 'banh-mi', label: 'Bánh Mì' },
  { value: 'ca-phe', label: 'Cà Phê' },
  { value: 'tra-sua', label: 'Trà Sữa' },
  { value: 'nuoc-ep', label: 'Nước Ép' },
  { value: 'banh-ngot', label: 'Bánh Ngọt' }
];

const MerchantRegisterPage = () => {
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const suggestionListRef = useRef(null);

    const {
        address: displayAddress,
        suggestions,
        handleInputChange,
        handleKeyDown,
        activeSuggestionIndex,
        selectSuggestion,
        reverseGeocode,
        handleDetectLocation
    } = useAddressSearch({
        onSelect: (data) => {
            setFormData(prev => ({ ...prev, address: data }));
        }
    });

    useEffect(() => {
        if (activeSuggestionIndex >= 0 && suggestionListRef.current) {
            const activeItem = suggestionListRef.current.childNodes[activeSuggestionIndex];
            if (activeItem) {
                activeItem.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            }
        }
    }, [activeSuggestionIndex]);
    
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        type: '',
        phone: '',
        address: '',
        openTime: '08:00',
        closeTime: '22:00'
    });

    const handleConfirmMapLocation = () => {
        setIsMapModalOpen(false);
        toast.success('Đã xác nhận vị trí trên bản đồ!');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateStep1 = () => {
        if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
            toast.error('Vui lòng điền đầy đủ thông tin tài khoản');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error('Mật khẩu không khớp');
            return false;
        }
        if (formData.password.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep1()) setStep(2);
    };

    const prevStep = () => {
        setStep(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.type || !formData.phone || !formData.address) {
            toast.error('Vui lòng điền đầy đủ thông tin nhà hàng');
            return;
        }
        
        try {
            setIsLoading(true);
            await registerMerchant({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                name: formData.name,
                type: formData.type,
                phone: formData.phone,
                address: formData.address,
                openTime: formData.openTime,
                closeTime: formData.closeTime
            });
            
            toast.success('Đăng ký tài khoản nhà hàng thành công! Vui lòng đăng nhập.');
            navigate('/merchant/login'); 
            //console.log(formData);
        } catch (error) {
            toast.error(error.message || 'Đăng ký thất bại, vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.cardContainer}>
                <div className={styles.leftPanel}>
                    <div className={styles.branding}>
                        <img src="/src/assets/logo.png" alt="Foodly Logo" className={styles.logo} onError={(e) => e.target.style.display='none'} />
                        <h2>Foodly cho Đối Tác</h2>
                    </div>
                    <div className={styles.editorialContent}>
                        <h1>Mở rộng kinh doanh cùng chúng tôi.</h1>
                        <p>Tiếp cận hàng triệu khách hàng mới, tăng doanh thu và phát triển thương hiệu một cách dễ dàng với nền tảng Foodly.</p>
                        
                        <div className={styles.benefits}>
                            <div className={styles.benefitItem}>
                                <div className={styles.iconWrapper}>🚀</div>
                                <span>Tăng doanh thu vượt trội</span>
                            </div>
                            <div className={styles.benefitItem}>
                                <div className={styles.iconWrapper}>📊</div>
                                <span>Quản lý đơn hàng thông minh</span>
                            </div>
                            <div className={styles.benefitItem}>
                                <div className={styles.iconWrapper}>🤝</div>
                                <span>Hỗ trợ đối tác 24/7</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.rightPanel}>
                    <div className={styles.formHeader}>
                        <h2>Đăng Ký Đối Tác</h2>
                        <p>Trở thành đối tác nhà hàng của Foodly hôm nay</p>
                        <div className={styles.stepIndicator}>
                            <div className={`${styles.stepDot} ${step >= 1 ? styles.activeDot : ''}`}>1</div>
                            <div className={`${styles.stepLine} ${step >= 2 ? styles.activeLine : ''}`}></div>
                            <div className={`${styles.stepDot} ${step >= 2 ? styles.activeDot : ''}`}>2</div>
                        </div>
                    </div>

                    <div className={styles.formContent}>
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                    className={styles.stepContainer}
                                >
                                    <h3>Thiết lập tài khoản quản lý</h3>
                                    <div className={styles.inputGroup}>
                                        <label>Tên đăng nhập</label>
                                        <input 
                                            type="text" 
                                            name="username" 
                                            value={formData.username} 
                                            onChange={handleChange} 
                                            placeholder="Nhập tên đăng nhập"
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Email liên hệ</label>
                                        <input 
                                            type="email" 
                                            name="email" 
                                            value={formData.email} 
                                            onChange={handleChange} 
                                            placeholder="example@restaurant.com"
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Mật khẩu</label>
                                        <input 
                                            type="password" 
                                            name="password" 
                                            value={formData.password} 
                                            onChange={handleChange} 
                                            placeholder="Tối thiểu 6 ký tự"
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Xác nhận mật khẩu</label>
                                        <input 
                                            type="password" 
                                            name="confirmPassword" 
                                            value={formData.confirmPassword} 
                                            onChange={handleChange} 
                                            placeholder="Nhập lại mật khẩu"
                                        />
                                    </div>
                                    
                                    <button className={styles.primaryButton} onClick={nextStep} type="button">
                                        Tiếp tục &rarr;
                                    </button>
                                    <div className={styles.switchAuth}>
                                        Đã có tài khoản? <span onClick={() => navigate('/merchant/login')} className={styles.switchAuthLink}>Đăng nhập ngay</span>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                    className={styles.stepContainer}
                                >
                                    <h3>Thông tin nhà hàng</h3>
                                    <div className={styles.inputGroup}>
                                        <label>Tên nhà hàng</label>
                                        <input 
                                            type="text" 
                                            name="name" 
                                            value={formData.name} 
                                            onChange={handleChange} 
                                            placeholder="Tên thương hiệu / Cửa hàng"
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Danh mục chính</label>
                                        <select 
                                            name="type" 
                                            value={formData.type} 
                                            onChange={handleChange}
                                            className={styles.selectInput}
                                        >
                                            <option value="" disabled>-- Chọn danh mục --</option>
                                            {CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Số điện thoại cửa hàng</label>
                                        <input 
                                            type="tel" 
                                            name="phone" 
                                            value={formData.phone} 
                                            onChange={handleChange} 
                                            placeholder="0123 456 789"
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Giờ mở cửa</label>
                                        <input 
                                            type="time" 
                                            name="openTime" 
                                            value={formData.openTime} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Giờ đóng cửa</label>
                                        <input 
                                            type="time" 
                                            name="closeTime" 
                                            value={formData.closeTime} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Địa chỉ nhà hàng</label>
                                        <div className={styles.addressSearchBox}>
                                            <input 
                                                type="text" 
                                                value={displayAddress}
                                                onChange={(e) => handleInputChange(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Nhập địa chỉ nhà hàng..."
                                            />
                                            {suggestions.length > 0 && (
                                                <ul className={styles.suggestionList} ref={suggestionListRef}>
                                                    {suggestions.map((s, index) => (
                                                        <li key={s.place_id ||index} onClick={() => selectSuggestion(s)} className={index === activeSuggestionIndex ? styles.activeSuggestion : ''}>
                                                            <strong>{s.display_place || s.display_name.split(',')[0]}</strong>
                                                            <p>{s.display_name}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {/* Nút kích hoạt bản đồ khi không tìm thấy địa chỉ */}
                                            <button 
                                                type="button" 
                                                className={styles.mapTriggerBtn}
                                                onClick={() => setIsMapModalOpen(true)}
                                            >
                                                📍 Không tìm thấy địa chỉ? Chọn trên bản đồ
                                            </button>
                                        </div>

                                        {/* Modal Bản đồ */}
                                        <AnimatePresence>
                                            {isMapModalOpen && (
                                                <motion.div 
                                                    className={styles.modalOverlay}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                >
                                                    <div className={styles.modalContent}>
                                                        <div className={styles.modalHeader}>
                                                            <h3>Chọn vị trí chính xác</h3>
                                                            {/* Container chứa các hành động */}
                                                            <div className={styles.headerActions}>
                                                                <button 
                                                                    type="button" 
                                                                    className={styles.detectLocationBtn} // Sử dụng class style mới
                                                                    onClick={handleDetectLocation} // Hàm từ useAddressSearch
                                                                >
                                                                    {/* Sử dụng icon Navigation cho hành động định vị */}
                                                                    <Navigation size={15} /> 
                                                                    Lấy vị trí hiện tại
                                                                </button>
                                                                
                                                                {/* Nút X đóng modal đã được chỉnh style gọn hơn */}
                                                                <button onClick={() => setIsMapModalOpen(false)}>✕</button>
                                                            </div>
                                                        </div>
                                                        <div className={styles.mapWrapper}>
                                                            <MapPicker 
                                                                onLocationSelect={(lng, lat) => reverseGeocode(lng, lat)} 
                                                                initialCoords={formData.address?.location?.coordinates}
                                                            />
                                                        </div>
                                                        <div className={styles.modalFooter}>
                                                            <p>Nhấp vào bản đồ để chọn vị trí nhà hàng của bạn</p>
                                                            <button 
                                                                className={styles.primaryButton} 
                                                                onClick={handleConfirmMapLocation}
                                                                disabled={!formData.address?.location}
                                                            >
                                                                Xác nhận vị trí
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    
                                    <div className={styles.actionButtons}>
                                        <button className={styles.secondaryButton} onClick={prevStep} type="button">
                                            &larr; Quay lại
                                        </button>
                                        <button 
                                            className={styles.primaryButton} 
                                            onClick={handleSubmit} 
                                            type="button"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Đang xử lý...' : 'Hoàn tất Đăng ký'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MerchantRegisterPage;
