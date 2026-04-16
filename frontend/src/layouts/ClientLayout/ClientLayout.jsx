import { Outlet, useLocation } from 'react-router-dom';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import Footer from '../../components/footer/Footer';
import styles from './ClientLayout.module.css';

const ClientLayout = ({ children }) => {
    const location = useLocation();
    
    return (
        <div className={styles.layout}>
            <Header />
            <Sidebar />
            <main className={styles.main}>
                {children ?? <Outlet />}
            </main>
            <Footer />
        </div>
    )
};

export default ClientLayout;