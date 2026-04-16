import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { registerMerchant } from '../../services/authService';
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
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        type: '',
        phone: '',
        address: ''
    });

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
                address: formData.address
            });
            
            toast.success('Đăng ký tài khoản nhà hàng thành công! Vui lòng đăng nhập.');
            navigate('/merchant/login'); 
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
                                        <label>Địa chỉ chi tiết</label>
                                        <textarea 
                                            name="address" 
                                            value={formData.address} 
                                            onChange={handleChange} 
                                            placeholder="Số nhà, Tên đường, Quận, Thành phố..."
                                            rows="3"
                                        ></textarea>
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
