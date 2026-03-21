import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SignInEditorial, SignInInputs } from '../../components/Auth/SignInForm/SignInForm';
import { SignUpEditorial, SignUpInputs } from '../../components/Auth/SignUpForm/SignUpForm';
import styles from './AuthPage.module.css';

const AuthPage = () => {
    const [isSigningIn, setIsSigningIn] = useState(true);
    const [zIndex, setZIndex] = useState(10);
    const [initialUsername, setInitialUsername] = useState("");

    const toggleForm = () => setIsSigningIn(!isSigningIn);

    const handleRegisterSuccess = (username) => {
        setInitialUsername(username);
        setIsSigningIn(true);
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.bookContainer}>
                <div className={`${styles.paperPanel} ${styles.leftStaticPanel}`}>
                    <SignInEditorial />
                </div>

                <div className={`${styles.paperPanel} ${styles.rightStaticPanel}`}>
                    <SignUpEditorial />
                </div>

                <motion.div
                    className={styles.flippingPage}
                    animate={{ rotateY: isSigningIn ? 0 : -180 }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    onUpdate={(latest) => {
                        if (latest.rotateY < -90) setZIndex(1);
                        else setZIndex(10);
                    }}
                    style={{ zIndex: zIndex }}
                >
                    <div className={`${styles.pageFace} ${styles.frontFace}`}>
                        <SignInInputs onSwitch={toggleForm} initialUsername={initialUsername} />
                        <motion.div 
                            className={styles.overlay}
                            animate={{ opacity: isSigningIn ? 0 : 0.3 }}
                        />
                    </div>

                    <div className={`${styles.pageFace} ${styles.backFace}`}>
                        <SignUpInputs onSwitch={toggleForm} onRegisterSuccess={handleRegisterSuccess} />
                        <motion.div 
                            className={styles.overlay}
                            animate={{ opacity: isSigningIn ? 0.3 : 0 }}
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AuthPage;