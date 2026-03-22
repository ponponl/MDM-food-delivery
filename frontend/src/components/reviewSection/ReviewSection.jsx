import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import styles from './ReviewSection.module.css';

const ReviewsSection = ({ reviews }) => {
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const reviewListRef = useRef(null);
    if (!reviews || reviews.length === 0) return null;
    const totalRating = reviews ? reviews.reduce((acc, rev) => acc + rev.rating, 0) : 0;
    const avgRating = reviews && reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "0.0";
    const strokeDasharray = 220;
    const totalArcLength = 165;
    const progress = (avgRating / 5) * 165; 

    const checkScrollPosition = () => {
        if (reviewListRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = reviewListRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
        }
    };

    const scroll = (direction) => {
        if (reviewListRef.current) {
            const scrollAmount = direction === 'left' ? -320 : 320;
            reviewListRef.current.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div id="reviews" className={styles.reviewsSection}>
            <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Đánh giá</h3>
                <div className={styles.sectionNav}>
                    <button 
                        className={styles.navBtn} 
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        aria-label="Cuộn trái"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button 
                        className={styles.navBtn} 
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        aria-label="Cuộn phải"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            {/* Danh sách Review Card dạng Ngang */}
            <div className={styles.reviewList} ref={reviewListRef} onScroll={checkScrollPosition}>
                
                <div className={styles.ratingCard}>
                    <div className={styles.progressWrapper}>
                        <svg className={styles.svgContainer} viewBox="0 0 100 100">
                            <circle 
                                className={styles.bgCircle} 
                                cx="50" cy="50" r="35" 
                                style={{ strokeDasharray: `${totalArcLength} ${strokeDasharray}` }}
                            />
                            <circle 
                                className={styles.progressCircle} 
                                cx="50" cy="50" r="35"
                                style={{ strokeDasharray: `${progress} ${strokeDasharray}` }}
                            />
                        </svg>
                        
                        {/* Chỉ chứa số điểm ở giữa */}
                        <div className={styles.centerNumber}>
                            <span className={styles.ratingNumber}>{avgRating}</span>
                        </div>

                        {/* Khối chứa ngôi sao nằm đè lên thanh process */}
                        <div className={styles.starOverlay}>
                            <Star size={18} fill="#4d4d4d" color="#4d4d4d" />
                        </div>
                    </div>
                    <p className={styles.ofStarsText}>of 5 stars</p>
                </div>
                {reviews.map((rev) => (
                    <div key={rev._id} className={styles.reviewCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.avatar}>{rev.avatar}</div>
                            <div className={styles.userInfo}>
                                <div className={styles.userName}>{rev.userName}</div>
                                <div className={styles.date}>{rev.date}</div>
                            </div>
                        </div>

                        {/* Rating cá nhân của review */}
                        <div className={styles.individualStars}>
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={16}
                                    fill={i < rev.rating ? "#EE5335" : "none"}
                                    color="#EE5335"
                                />
                            ))}
                        </div>

                        {/* Comment */}
                        <p className={styles.comment}>{rev.comment}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReviewsSection;