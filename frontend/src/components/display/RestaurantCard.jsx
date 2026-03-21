import {Star, Dot} from 'lucide-react';
import styles from './RestaurantCard.module.css';

export default function RestaurantCard ({image, title, rating, ratingQuantity, distance, deliveryTime}) {
    return (
        <div className={styles.card}>
            <div className={styles.imageWrapper}>
                <img className={styles.imageCard} src={image} alt={title} />
            </div>
            <div className={styles.cardContent}>
                <h4>{title}</h4>
                <div className={styles.cardInfo}>
                    <div className={styles.rating}>
                        <span>{rating}</span>
                        <span><Star size={15} /></span>
                    </div>
                    <span>({ratingQuantity} đánh giá)</span>
                    {/* <span><Dot size={20} style={{ marginLeft: '-5px', marginRight: '-5px' }}/></span>
                    <span>{distance} km</span>
                    <span><Dot size={20} style={{ marginLeft: '-5px', marginRight: '-5px' }}/></span>
                    <span>{deliveryTime} mins</span> */}
                </div>
            </div>
        </div>
    );
}