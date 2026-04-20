import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Star, ArrowLeft, User } from "lucide-react";
import styles from "./RestaurantReviewPage.module.css";
import reviewApi from "../../../api/reviewApi";

export default function RestaurantReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const { restaurantName } = location.state || { restaurantName: "Nhà hàng" };

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await reviewApi.getReviewsByRestaurantId(id);
        setReviews(response?.data || response || []);
      } catch (error) {
        console.error("Lỗi khi tải đánh giá nhà hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReviews();
    }
  }, [id]);

  const maskUserName = (name) => {
    if (!name) return "Ẩn danh";
    const parts = name.trim().split(" ");
    const first = parts[0];
    return `${first.slice(0, 3)}***`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
  };

  if (loading)
    return (
      <div className={styles.reviewPage}>
        <header className={styles.header}>
          <div className={styles.skeletonButton} />
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonRatingRow}>
            <div className={styles.skeletonBigRating} />
            <div className={styles.skeletonStarsCol}>
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLineShort} />
            </div>
          </div>
        </header>

        <main className={styles.reviewList}>
          {[...Array(4)].map((_, index) => (
            <div key={index} className={styles.reviewCard}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonContent}>
                <div className={styles.skeletonHeaderRow}>
                  <div className={styles.skeletonName} />
                  <div className={styles.skeletonRatingChip} />
                </div>
                <div className={styles.skeletonLineShort} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLine} />
              </div>
            </div>
          ))}
        </main>
      </div>
    );

  const totalReviews = reviews.length;
  const avgRatingNumber =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
  const avgRating = totalReviews > 0 ? avgRatingNumber.toFixed(1) : 0;

  return (
    <div className={styles.reviewPage}>
      <header className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          <ArrowLeft size={20} /> Quay lại nhà hàng
        </button>
        <div className={styles.restaurantSummary}>
          <h1>Đánh giá về {restaurantName}</h1>
          <div className={styles.ratingOverview}>
            <span className={styles.bigRating}>{avgRating}</span>
            <div className={styles.starsCol}>
              <div className={styles.starsRow}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={i < Math.floor(avgRatingNumber) ? "#FF6B35" : "none"}
                    color="#FF6B35"
                  />
                ))}
              </div>
              <span>Dựa trên {totalReviews} đánh giá</span>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.reviewList}>
        {totalReviews > 0 ? (
          reviews.map((review, index) => (
            <div key={review.id || index} className={styles.reviewCard}>
              <div className={styles.userAvatar}>
                <User size={24} color="#9ca3af" />
              </div>
              <div className={styles.reviewContent}>
                <div className={styles.reviewHeader}>
                  <span className={styles.userName}>
                    {maskUserName(review.user_name)}
                  </span>
                  <div className={styles.itemRating}>
                    {review.rating}{" "}
                    <Star size={14} fill="#FF6B35" color="#FF6B35" />
                  </div>
                </div>
                <span className={styles.reviewDate}>
                  {formatDate(review.created_at)}
                </span>
                <p className={styles.comment}>{review.comment}</p>
              </div>
            </div>
          ))
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
      </main>
    </div>
  );
}
