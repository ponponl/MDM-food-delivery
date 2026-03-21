import {Star, Dot} from 'lucide-react';
import styles from './HomeCard.module.css';

export default function HomeCard ({image, title, rating, ratingQuantity, distance, deliveryTime}) {
    return (
        <div className={styles.card}>
            <img className={styles.imageCard} src={image} alt={title} />
            <div className={styles.cardContent}>
                <h3>{title}</h3>
                <div className={styles.cardInfo}>
                    <span>{rating}</span>
                    <span><Star size={16} /></span>
                    <span>(+{ratingQuantity})</span>
                    <span><Dot size={20} style={{ marginLeft: '-5px', marginRight: '-5px' }}/></span>
                    <span>{distance} km</span>
                    <span><Dot size={20} style={{ marginLeft: '-5px', marginRight: '-5px' }}/></span>
                    <span>{deliveryTime} mins</span>
                </div>
            </div>
        </div>
    );
}