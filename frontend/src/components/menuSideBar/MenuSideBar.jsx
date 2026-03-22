import React from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './MenuSidebar.module.css';

const MenuSidebar = ({ categories, activeCategory, onCategoryClick }) => {
    return (
        <aside className={styles.menuSidebar}>
            <nav className={styles.categoryList}>
                <a 
                    href="#reviews" 
                    className={`${styles.catLink} ${
                        activeCategory === 'reviews' ? styles.active : ''
                    }`}
                    onClick={() => onCategoryClick('reviews')}
                >
                    Đánh giá
                </a>
                {categories.map((cat) => (
                    <a
                        key={cat}
                        href={`#${cat}`}
                        className={`${styles.catLink} ${
                            activeCategory === cat ? styles.active : ''
                        }`}
                        onClick={() => onCategoryClick(cat)}
                    >
                        {cat}
                    </a>
                ))}
            </nav>
        </aside>
    );
};

export default MenuSidebar;