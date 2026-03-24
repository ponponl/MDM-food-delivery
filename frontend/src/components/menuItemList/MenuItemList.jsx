import React from 'react';
import { Plus } from 'lucide-react';
import styles from './MenuItemList.module.css';

const MenuItemsList = ({ groupedMenu, onAddToCart }) => {
    console.log(groupedMenu);
    return (
        <div className={styles.menuItemsList}>
            {Object.entries(groupedMenu).map(([category, items]) => (
                <div key={category} id={category} className={styles.categorySection}>
                    <h2 className={styles.categoryTitle}>{category}</h2>
                    <div className={styles.foodGrid}>
                        {items.map((item) => (
                            <div key={item._id} className={styles.foodCard}>
                                {/* Nội dung chữ bên trái */}
                                <div className={styles.foodInfo}>
                                    <h4 className={styles.foodName}>{item.name}</h4>
                                    <p className={styles.foodDescription}>
                                        {/* Giả lập kJ nếu bạn muốn giống ảnh */}
                                        <span className={styles.kjText}>(2678 kJ)</span> {item.description}
                                    </p>
                                    <span className={styles.price}>
                                        {item.price.toLocaleString()}đ
                                    </span>
                                </div>

                                {/* Ảnh và nút Add bên phải */}
                                <div className={styles.imageWrapper}>
                                    <img src={item.images[0]} alt={item.name} className={styles.foodImage} />
                                    <button
                                        className={styles.addBtn}
                                        type="button"
                                        aria-label={`Add ${item.name} to cart`}
                                        onClick={() => onAddToCart?.(item)}
                                    >
                                        <Plus size={20} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MenuItemsList;