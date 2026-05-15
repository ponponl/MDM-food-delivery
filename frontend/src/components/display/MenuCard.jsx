import { Plus, Star } from 'lucide-react';
import styles from './MenuCard.module.css';

const MenuCard = ({ item, isUnavailable, statusLabel, onAddToCart, onOpenCustomization }) => {
    const ratingCount = Number.isFinite(Number(item?.ratingCount))
        ? Number(item.ratingCount)
        : (Number.isFinite(Number(item?.totalReview)) ? Number(item.totalReview) : 0);
    const ratingValue = Number.isFinite(Number(item?.rating))
        ? Number(item.rating)
        : (Number.isFinite(Number(item?.avgRating)) ? Number(item.avgRating) : 0);
    const displayRating = ratingCount > 0 ? ratingValue.toFixed(1) : '0.0';

    const handleAddClick = (e) => {
        e.stopPropagation();
        const hasRequiredCustomization = item?.customization?.some(group => group.isRequired === true);

        if (hasRequiredCustomization) {
            onOpenCustomization?.(item);
        } else {
            onAddToCart?.(item);
        }
    };

    return (
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
                {ratingCount > 0 && (
                    <div className={styles.ratingRow}>
                        <span className={styles.ratingValue}>{displayRating}</span>
                        <Star size={14} className={styles.ratingStar} />
                        <span className={styles.ratingCount}>({ratingCount})</span>
                    </div>
                )}
            </div>

            <div className={styles.priceCol}>
                <span className={styles.price}>{item?.price?.toLocaleString()}đ</span>
            </div>

            <div className={styles.actionCol}>
                <button
                    className={styles.addBtn}
                    type="button"
                    aria-label={`Add ${item?.name} to cart`}
                    onClick={handleAddClick}
                    disabled={isUnavailable}
                >
                    <Plus size={18} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
};

export default MenuCard;
