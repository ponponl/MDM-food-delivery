import React, { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import styles from "./FoodReviewPage.module.css";
import reviewApi from "../../../api/reviewApi";
import { useAuth } from "../../../context/AuthContext";

const FoodReviewPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const foodItem = location.state?.foodItem;
  const { user } = useAuth();
  const hasTracked = useRef(false);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const response = await reviewApi.getReviewsByItemId(id);
        const data = response?.data || response || [];
        setReviews(data);
        const itemId = foodItem.itemId;
        if (user && (user.id || user.user_id) && !hasTracked.current) {
          hasTracked.current = true;
          reviewApi.trackItemView({ itemId }).catch(err => console.error("Tracking error", err));
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoadingReviews(false);
      }
    };

    if (id) {
      fetchReviews();
    }
  }, [id]);

  if (!foodItem) return <div>Đang tải dữ liệu món ăn...</div>;

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          style={{
            color: i <= rating ? "#ffc107" : "#e4e5e9",
            fontSize: "20px",
          }}
        >
          ★
        </span>,
      );
    }
    return stars;
  };

  return (
    <div className={styles.container}>
      <div className={styles.foodHeader}>
        <img
          src={foodItem.images}
          alt={foodItem.name}
          className={styles.foodImage}
        />
        <div className={styles.foodInfo}>
          <h1>{foodItem.name}</h1>
          <p className={styles.price}>{foodItem.price.toLocaleString()}đ</p>
          <p>{foodItem.description}</p>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.reviewSection}>
        <h3>Đánh giá từ khách hàng</h3>
        {loadingReviews ? (
          <p>Đang tải đánh giá...</p>
        ) : reviews.length > 0 ? (
          <div className={styles.reviewsList}>
            {reviews.map((rev, index) => (
              <div key={index} className={styles.reviewItem}>
                <div className={styles.reviewHeader}>
                  <div className={styles.rating}>{renderStars(rev.rating)}</div>
                  <span className={styles.date}>
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className={styles.comment}>{rev.comment}</p>
                <p>{rev.itemid}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyContainer}>
            <img
              src="https://thumbs.dreamstime.com/b/no-stars-symbol-bad-review-low-rating-dislike-concept-crossed-out-star-illustration-414279395.jpg"
              alt="No reviews"
              className={styles.emptyImage}
            />
            <p className={styles.emptyText}>
              Chưa có đánh giá nào cho món này.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodReviewPage;
