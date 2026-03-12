import styles from './SmallBanner.module.css'

export default function SmallBanner({image, title, description, bgColor, textColor, bannerButton, bannerPath}) {
    return (
        <div className={styles.smallBanner} style={{ backgroundColor: bgColor, color: textColor}}>
            <div className={styles.textContent} style={{ backgroundColor: bgColor, color: textColor}}>
                <div className={styles.textStyle}>
                <h3>{title}</h3>
                <p>{description}</p>
                </div>
                <button className={styles.bannerButton}>{bannerButton}</button>
            </div>
            <div className={styles.imagePart}>
                <img src={image} alt={title} className={styles.imageBanner}/>
            </div>
        </div>
    );
}