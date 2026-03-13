import styles from './CategoryTag.module.css';

export default function CategoryTag ({icon, category}) {
    return (
        <div className={styles.categoryTag}>
            <span className={styles.categoryIcon}>{icon}</span>
            <span className={styles.categoryText}>{category}</span>
        </div>
    );
}