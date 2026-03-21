import { Outlet, useLocation } from 'react-router-dom';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import styles from './ClientLayout.module.css';

const ClientLayout = () => {
    const location = useLocation();
    
    return (
        <div className={styles.layout}>
            <Header />
            <main className={styles.main}>
                <Outlet />
            </main>
            {location.pathname !== '/checkout' && <Footer />}
        </div>
    )
};

export default ClientLayout;