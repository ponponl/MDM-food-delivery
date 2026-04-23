import {Star, Dot} from 'lucide-react';
import styles from './RestaurantCard.module.css';

export default function RestaurantCard ({image, title, rating, ratingQuantity, onClick}) {
    const totalReviews = Number.isFinite(Number(ratingQuantity)) ? Number(ratingQuantity) : 0;
    const avgRating = Number.isFinite(Number(rating)) ? Number(rating) : 0;
    const displayRating = totalReviews > 0 ? avgRating.toFixed(1) : '0';

    return (
        <div className={styles.card} onClick={onClick}>
            <div className={styles.imageWrapper}>
                <img className={styles.imageCard} src={image} alt={title} />
            </div>
            <div className={styles.cardContent}>
                <h4>{title}</h4>
                <div className={styles.cardInfo}>
                    {totalReviews === 0 ? (
                        <span className={styles.newBadge}>Quán mới</span>
                    ) : (
                        <>
                            <div className={styles.rating}>
                                <span>{displayRating}</span>
                                <span><Star size={15} /></span>
                            </div>
                            <span>({totalReviews} đánh giá)</span>
                        </>
                    )}
                    {/* <span><Dot size={20} style={{ marginLeft: '-5px', marginRight: '-5px' }}/></span>
                    <span>{distance} km</span>
                    <span><Dot size={20} style={{ marginLeft: '-5px', marginRight: '-5px' }}/></span>
                    <span>{deliveryTime} mins</span> */}
                </div>
            </div>
        </div>
    );
}