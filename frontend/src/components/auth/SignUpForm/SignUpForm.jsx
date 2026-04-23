import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { register } from "../../../services/authService";
import styles from "./SignUpForm.module.css";
import toast from "react-hot-toast";

const SignUpEditorial = () => (
  <div className={styles.editorialPart}>
    <div className={styles.topSection}>
      <div className={styles.imageContainer}>
        <div className={styles.imageWrapper}>
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000"
            alt="Món ăn cao cấp"
          />
          <div className={styles.imageOverlay}></div>
        </div>
        <p className={styles.caption}>TỪ 2024 — CÔNG THỨC BÍ MẬT SỐ 42</p>
      </div>

      <div className={styles.articleContent}>
        {/* <span className={styles.dropCap}>B</span> */}
        <p className={styles.quoteText}>
          "Món ngon kết nối mọi người."
        </p>
      </div>
    </div>

    <div className={styles.editorialFooter}>
      <div className={styles.divider}></div>
      <div className={styles.footerFlex}>
        <span>MÓN TRONG THỰC ĐƠN... 500+</span>
        <span>TP. HỒ CHÍ MINH, THỨ HAI, 30 PHÚT</span>
        <span>GIAO HÀNG MIỄN PHÍ</span>
      </div>
    </div>
  </div>
);

const SignUpInputs = ({ onSwitch, onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const validateForm = () => {
    const { fullName, email, password, confirmPassword } = formData;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Email không đúng định dạng!";

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(fullName)) {
      return "Tên đăng nhập từ 3-20 ký tự, không chứa ký tự đặc biệt!";
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      return "Mật khẩu phải có ít nhất 8 ký tự, bao gồm cả chữ và số!";
    }

    if (password !== confirmPassword) return "Mật khẩu nhập lại không khớp!";

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await register({
        username: formData.fullName.trim(),
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        addresses: [],
      });

      toast.success("Đăng ký thành công! Chào mừng bạn đến với Foodly.", {
        duration: 4000,
        style: {
          background: "#FFFFFF",
          color: "#1F2933",
          padding: "12px 20px",
          borderRadius: "8px",
          border: "1px solid #E5E7EB",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          fontFamily: '"Lexend", "Segoe UI", sans-serif',
        },
        iconTheme: {
          primary: "#4CAF50",
          secondary: "#FFFFFF",
        },
      });

      const registeredUsername = formData.fullName.trim();
      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      if (onRegisterSuccess) {
        onRegisterSuccess(registeredUsername);
      } else if (onSwitch) {
        onSwitch();
      }
    } catch (err) {
      setError(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.formPart}
      style={{ width: "100%", height: "100%", borderRight: "none" }}
    >
      <h2>Tham gia Foodly</h2>
      {error && <div className={styles.errorMessage}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label>Địa chỉ Email</label>
          <input
            name="email"
            type="email"
            value={formData.email}
            placeholder="example@gmail.com"
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Tên đăng nhập</label>
          <input
            name="fullName"
            type="text"
            value={formData.fullName}
            placeholder="Dùng để đăng nhập..."
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Mật khẩu</label>
          <div className={styles.passwordWrapper}>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="Ít nhất 8 ký tự (chữ & số)"
              required
            />
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <div className={styles.inputGroup}>
          <label>Nhập lại mật khẩu</label>
          <div className={styles.passwordWrapper}>
            <input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <button type="submit" className={styles.signUpBtn} disabled={loading}>
          {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </button>
      </form>

      <p className={styles.switchText}>
        Bạn đã có tài khoản? <span onClick={onSwitch}>Đăng nhập ngay</span>
      </p>
    </div>
  );
};

const SignUpForm = ({ onSwitch }) => {
  return (
    <div className={styles.container}>
      <SignUpInputs onSwitch={onSwitch} />
      <SignUpEditorial />
    </div>
  );
};

export { SignUpEditorial, SignUpInputs };
export default SignUpForm;
