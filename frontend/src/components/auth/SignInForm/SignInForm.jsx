import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { login } from "../../../services/authService";
import { useAuth } from "../../../context/AuthContext";
import styles from "./SignInForm.module.css";
import toast from 'react-hot-toast';

const SignInEditorial = () => (
  <div className={styles.editorialPart}>
    <div className={styles.masthead}>
      <h1>FOODLY</h1>
      <div className={styles.mastheadDetails}>
        <span>Từ 2024 — Từ bếp địa phương đến bàn ăn của bạn</span>
        <span>⭐ Giao hàng cao cấp ⭐</span>
      </div>
    </div>

    <div className={styles.mainArticle}>
      <div className={styles.mainLogoWrapper}>
        <img 
          src="/FOODLY-logo.png"
          className={styles.mainLogo} 
          alt="Logo Foodly" 
        />
        <div className={styles.photoCredit}>Bữa ăn tươi mỗi ngày</div>
      </div>
      
      <div className={styles.articleSnippet}>
        <h3 className={styles.articleTitle}>Từ bếp đến tận cửa</h3>
        <p>
          Khám phá những nhà hàng địa phương tốt nhất được chọn riêng cho bạn.
          Nguyên liệu tươi, đầu bếp tâm huyết và giao hàng siêu nhanh
          mang vị ngon đến mọi lúc, mọi nơi.
        </p>
      </div>
    </div>

    <div className={styles.editorialFooter}>
      <div className={styles.thickDivider}></div>
      <p className={styles.footerQuote}>"Món ngon kết nối mọi người."</p>
    </div>
  </div>
);

const SignInInputs = ({ onSwitch, initialUsername }) => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  useEffect(() => {
    if (initialUsername) {
        setFormData(prev => ({ ...prev, username: initialUsername }));
    }
  }, [initialUsername]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const response = await login(formData);
        
        const user = response.data?.user || response.data?.data?.user;

        loginUser(user);

        toast.success(`Chào mừng trở lại, ${user.username}!`, {
          duration: 3000,
          style: {
            background: '#FFFFFF',
            color: '#1F2933',
            padding: '12px 24px',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            fontSize: '15px',
            fontWeight: '600',
            fontFamily: '"Lexend", "Segoe UI", sans-serif',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          iconTheme: {
            primary: '#FF6B35',
            secondary: '#FFFFFF',
          },
        });
        
        navigate('/');
    } catch (err) {
        setError(err.message || "Tên đăng nhập hoặc mật khẩu không chính xác.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className={styles.formPart} style={{ width: "100%", height: "100%" }}>
      <h2>Đăng nhập</h2>
      {error && <div className={styles.errorMessage}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label htmlFor="username">Tên đăng nhập</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Nhập username của bạn"
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="password">Mật khẩu</label>
          <div className={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
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
        <button type="submit" className={styles.signInBtn} disabled={loading}>
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </form>

      <p className={styles.switchText}>
        Bạn chưa có tài khoản? <span onClick={onSwitch}>Đăng ký ngay</span>
      </p>
    </div>
  );
};

const SignInForm = ({ onSwitch }) => {
  return (
    <div className={styles.container}>
      <SignInEditorial />
      <SignInInputs onSwitch={onSwitch} />
    </div>
  );
};

export { SignInEditorial, SignInInputs };
export default SignInForm;