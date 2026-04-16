import { Plus } from 'lucide-react';
import styles from './MenuCard.module.css';

const MenuCard = ({ item, isUnavailable, statusLabel, onAddToCart }) => (
    <div className={`${styles.foodCard} ${isUnavailable ? styles.unavailableCard : ''}`}>
        <div className={styles.cardImageCol}>
            <img
                src={item?.images?.[0]}
                alt={item?.name}
                className={styles.foodImage}
            />
            {isUnavailable && (
                <div className={styles.unavailableOverlay}>
                    <span className={styles.unavailableText}>{statusLabel}</span>
                </div>
            )}
        </div>

        <div className={styles.foodInfo}>
            <h4 className={styles.foodName}>{item?.name}</h4>
            <p className={styles.foodDescription}>{item?.description}</p>
        </div>

        <div className={styles.priceCol}>
            <span className={styles.price}>{item?.price?.toLocaleString()}đ</span>
        </div>

        <div className={styles.actionCol}>
            <button
                className={styles.addBtn}
                type="button"
                aria-label={`Add ${item?.name} to cart`}
                onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart?.(item);
                }}
                disabled={isUnavailable}
            >
                <Plus size={18} strokeWidth={3} />
            </button>
        </div>
    </div>
);

export default MenuCard;
