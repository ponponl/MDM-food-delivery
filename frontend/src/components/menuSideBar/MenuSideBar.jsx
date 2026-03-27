import React from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './MenuSidebar.module.css';

const MenuSidebar = ({ categories, activeCategory, onCategoryClick }) => {
    const handleCategoryClick = (event, category) => {
        event.preventDefault();
        const target = document.getElementById(category);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        onCategoryClick(category);
    };

    return (
        <aside className={styles.menuSidebar}>
            <nav className={styles.categoryList}>
                {categories.map((cat) => (
                    <a
                        key={cat}
                        href={`#${cat}`}
                        className={`${styles.catLink} ${
                            activeCategory === cat ? styles.active : ''
                        }`}
                        onClick={(event) => handleCategoryClick(event, cat)}
                    >
                        {cat}
                    </a>
                ))}
            </nav>
        </aside>
    );
};

export default MenuSidebar;