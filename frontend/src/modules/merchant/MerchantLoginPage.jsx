import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { loginMerchant } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import styles from './MerchantRegisterPage.module.css';

const MerchantLoginPage = () => {
    const navigate = useNavigate();
    const { loginUser: authenticateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.username || !formData.password) {
            toast.error('Vui lòng điền đủ tên đăng nhập và mật khẩu');
            return;
        }
        
        try {
            setIsLoading(true);
            const data = await loginMerchant({
                username: formData.username,
                password: formData.password
            });
            
            authenticateUser(data.data.user);
            toast.success('Đăng nhập quản lý thành công!');
            navigate('/merchant/dashboard'); 
        } catch (error) {
            toast.error(error.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại.');
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
                        <Link to="/" className={styles.brandLink}>Foodly</Link>
                        <h2> cho Đối Tác</h2>
                    </div>
                    <div className={styles.editorialContent}>
                        <h1>Chào mừng trở lại!</h1>
                        <p>Đăng nhập vào bảng điều khiển để tiếp tục quản lý hoạt động kinh doanh, cập nhật món mới và theo dõi doanh thu.</p>
                        
                        <div className={styles.benefits}>
                            <div className={styles.benefitItem}>
                                <div className={styles.iconWrapper}>📈</div>
                                <span>Báo cáo doanh thu chi tiết</span>
                            </div>
                            <div className={styles.benefitItem}>
                                <div className={styles.iconWrapper}>⚡</div>
                                <span>Tiếp nhận đơn hàng siêu tốc</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.rightPanel}>
                    <div className={styles.formHeader}>
                        <h2>Đăng Nhập Quản Lý</h2>
                        <p>Truy cập vào hệ thống dành riêng cho nhà hàng</p>
                    </div>

                    <div className={styles.formContent}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={styles.stepContainer}
                        >
                            <div className={styles.inputGroup}>
                                <label>Tên đăng nhập</label>
                                <input 
                                    type="text" 
                                    name="username" 
                                    value={formData.username} 
                                    onChange={handleChange} 
                                    placeholder="manager_account_123"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSubmit(e)
                                    }}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Mật khẩu</label>
                                <input 
                                    type="password" 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    placeholder="••••••••"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSubmit(e)
                                    }}
                                />
                            </div>
                            
                            <div className={styles.actionButtons}>
                                <button 
                                    className={styles.primaryButton} 
                                    onClick={handleSubmit} 
                                    type="button"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Đang xác thực...' : 'Đăng Nhập'}
                                </button>
                            </div>

                            <div className={styles.switchAuth}>
                                Chưa là đối tác? <span onClick={() => navigate('/merchant/register')} className={styles.switchAuthLink}>Đăng ký ngay</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MerchantLoginPage;
