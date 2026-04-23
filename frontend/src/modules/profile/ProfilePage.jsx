import React, { useState, useEffect } from "react";
import { User, MapPin, Plus, Trash2, Save } from "lucide-react";
import styles from "./ProfilePage.module.css";
import { useAuth } from "../../context/AuthContext";
import { updateProfile, updateAddresses } from "../../services/authService";
import AddressItem from "../../components/addressItem/addressItem";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, loginUser } = useAuth();

  const [userProfile, setUserProfile] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [addresses, setAddresses] = useState([]);
  const [originalAddresses, setOriginalAddresses] = useState([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAddresses, setIsSavingAddresses] = useState(false);

  useEffect(() => {
    if (user) {
      setUserProfile({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
      });

      let parsedAddresses = user.addresses || [];
      if (typeof parsedAddresses === "string") {
        try {
          parsedAddresses = JSON.parse(parsedAddresses);
          // handle double encoding if any
          if (typeof parsedAddresses === "string") {
            parsedAddresses = JSON.parse(parsedAddresses);
          }
        } catch (e) {
          parsedAddresses = [];
        }
      } else if (!Array.isArray(parsedAddresses)) {
        parsedAddresses = [];
      }
      setAddresses(parsedAddresses);
      setOriginalAddresses(parsedAddresses);
    }
  }, [user]);

  const isAddressesChanged =
    JSON.stringify(addresses) !== JSON.stringify(originalAddresses);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Check nếu phone có nhập thì không được chứa chữ cái
    if (userProfile.phone && !/^\d+$/.test(userProfile.phone)) {
      toast.error("Số điện thoại không hợp lệ, chỉ được nhập số.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedUser = await updateProfile({
        name: userProfile.name,
        phone: userProfile.phone,
      });

      // Sync with context
      loginUser(updatedUser);
      toast.success("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Lỗi cập nhật profile:", error);
      toast.error(error.message || "Cập nhật thất bại, vui lòng thử lại.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdateAddresses = async (e) => {
    if (e) e.preventDefault();
    setIsSavingAddresses(true);
    try {
      const updatedUser = await updateAddresses(addresses);

      // Sync with context
      loginUser(updatedUser);
      toast.success("Lưu địa chỉ mới thành công!");
    } catch (error) {
      console.error("Lỗi cập nhật địa chỉ:", error);
      toast.error(error.message || "Lưu địa chỉ thất bại, vui lòng thử lại.");
    } finally {
      setIsSavingAddresses(false);
    }
  };

  const addNewAddress = () => {
      const newAddr = { 
          building: "", 
          note: "", 
          full: "", 
          location: null 
      };
      setAddresses([...addresses, newAddr]);
  };

  const removeAddress = (index) => {
    const newAddrs = addresses.filter((_, i) => i !== index);
    setAddresses(newAddrs);
  };

  const handleAddressChange = (index, updatedAddr) => {
    const newAddrs = [...addresses];
    newAddrs[index] = updatedAddr; 
    setAddresses(newAddrs);
  };

  if (!user) return <div>Đang tải...</div>;

  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.pageTitle}>Tài khoản của tôi</h1>
      {userProfile.name && (
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: "20px" }}>
          Xin chào, <strong>{userProfile.name}</strong>!
        </p>
      )}

      <div className={styles.layout}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <User size={20} /> <h2>Thông tin cá nhân</h2>
          </div>
          <form onSubmit={handleUpdateProfile}>
            <div className={styles.inputGroup}>
              <label>Địa chỉ Email</label>
              <input
                type="email"
                value={userProfile.email}
                readOnly
                className={styles.readOnlyInput}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Tên hiển thị</label>
              <input
                type="text"
                value={userProfile.name}
                onChange={(e) =>
                  setUserProfile({ ...userProfile, name: e.target.value })
                }
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Số điện thoại</label>
              <input
                type="text"
                value={userProfile.phone}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d+$/.test(val)) {
                    setUserProfile({ ...userProfile, phone: val });
                  }
                }}
              />
            </div>

            <button
              type="submit"
              className={styles.saveBtn}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <MapPin size={20} /> <h2>Sổ địa chỉ</h2>
            <button
              className={styles.textBtn}
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: "5px",
                alignItems: "center",
              }}
              onClick={addNewAddress}
              type="button"
            >
              <Plus size={16} /> Thêm mới
            </button>
          </div>

          <div className={styles.addressList}>
            {addresses.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#9CA3AF",
                  padding: "20px 0",
                }}
              >
                Chưa có địa chỉ nào, hãy thêm mới
              </div>
            )}
            {/* {addresses.map((addr, index) => (
              <div key={index} className={styles.addressItem}>
                <div className={styles.addressInfo}>
                  <p style={{ marginBottom: "10px" }}>
                    <strong>Địa chỉ {index + 1}</strong>
                  </p>

                  <div className={styles.inputGroup}>
                    <label style={{ fontSize: "12px" }}>Đường / Tòa nhà</label>
                    <input
                      type="text"
                      value={addr.street}
                      onChange={(e) =>
                        handleAddressChange(index, "street", e.target.value)
                      }
                      placeholder="Nhập địa chỉ..."
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label style={{ fontSize: "12px" }}>Thành phố / Tỉnh</label>
                    <input
                      type="text"
                      value={addr.city}
                      onChange={(e) =>
                        handleAddressChange(index, "city", e.target.value)
                      }
                      placeholder="Nhập thành phố..."
                      required
                    />
                  </div>
                </div>
                <div className={styles.addressActions}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => removeAddress(index)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ff4d4f",
                      cursor: "pointer",
                      padding: "5px",
                    }}
                    title="Xóa địa chỉ"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))} */}
            {addresses.map((addr, index) => (
                <AddressItem 
                    key={index} 
                    index={index} 
                    addr={addr} 
                    onChange={handleAddressChange} 
                    onRemove={removeAddress} 
                />
            ))}
          </div>

          {isAddressesChanged && (
            <div style={{ marginTop: "20px" }}>
              <button
                type="button"
                className={styles.saveBtn}
                onClick={handleUpdateAddresses}
                disabled={isSavingAddresses}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Save size={18} />
                {isSavingAddresses ? "Đang lưu..." : "Lưu địa chỉ"}
              </button>
              <button
                type="button"
                onClick={() => setAddresses(originalAddresses)}
                style={{
                  marginTop: "10px",
                  width: "100%",
                  padding: "10px",
                  background: "transparent",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: "#4b5563",
                }}
              >
                Hủy bỏ
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
