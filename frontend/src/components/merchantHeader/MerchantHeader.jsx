import { Link, useNavigate } from 'react-router-dom';
import { SignOutIcon } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutService } from '../../services/authService';
import styles from './MerchantHeader.module.css';

const MerchantHeader = () => {
    const { user, logoutUser } = useAuth();
    const navigate = useNavigate();
    const displayName = user?.username || user?.name || 'Doi tac';

    const handleLogout = async () => {
        try {
            await logoutService();
            logoutUser();
            navigate('/merchant/login', { replace: true });
        } catch (error) {
            console.error('Dang xuat that bai:', error);
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.leftGroup}>
                <Link className={styles.logo} to="/merchant/dashboard">FOODLY</Link>
            </div>
            <div className={styles.rightGroup}>
                <span className={styles.welcome}>Xin chào, {displayName}</span>
                <button className={styles.logoutButton} type="button" onClick={handleLogout} aria-label="Dang xuat">
                    <SignOutIcon size={18} weight="bold" />
                </button>
            </div>
        </header>
    );
};

export default MerchantHeader;
