import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import MerchantHeader from '../../components/merchantHeader/MerchantHeader';
import MerchantSidebar from '../../components/merchantSidebar/MerchantSidebar';
import Footer from '../../components/footer/Footer';
import { useAuth } from '../../context/AuthContext';
import styles from './MerchantLayout.module.css';

const MerchantLayout = ({ children }) => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/merchant/login', { replace: true });
        }
    }, [loading, navigate, user]);

    return (
        <div className={styles.layout}>
            <MerchantHeader />
            <MerchantSidebar />
            <main className={styles.main}>
                {children ?? <Outlet />}
            </main>
            <Footer />
        </div>
    );
};

export default MerchantLayout;
