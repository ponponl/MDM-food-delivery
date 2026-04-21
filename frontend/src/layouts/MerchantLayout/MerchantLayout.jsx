import { Outlet } from 'react-router-dom';
import MerchantHeader from '../../components/merchantHeader/MerchantHeader';
import MerchantSidebar from '../../components/merchantSidebar/MerchantSidebar';
import Footer from '../../components/footer/Footer';
import styles from './MerchantLayout.module.css';

const MerchantLayout = ({ children }) => {
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
