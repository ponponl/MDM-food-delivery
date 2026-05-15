import { useEffect, useMemo, useState, useRef, useContext } from 'react';
import { X } from 'lucide-react';
import styles from './ConfirmOrderModal.module.css';
import { useAddressSearch } from '../../hooks/useAddressSearch.js';
import { useAuth } from "../../context/AuthContext";
import { AddressContext } from '../../context/AddressContext';
import AddressItem from "../../components/addressItem/AddressItem";
import { updateAddresses } from '../../services/authService';
import toast from "react-hot-toast";

const normalizeAddress = (addr, defaults) => {
  if (!addr) return null;
  const addressText = addr.full || addr.address || [addr.street, addr.city].filter(Boolean).join(', ');
  return {
    receiver: addr.receiver || addr.name || defaults?.receiver || '',
    phone: addr.phone || addr.phoneNumber || defaults?.phone || '',
    address: addressText || '',
    location: addr.location || null
  };
};

const formatAddressLabel = (addr) => {
  const receiver = addr.receiver ? `${addr.receiver}` : '';
  const phone = addr.phone ? ` - ${addr.phone}` : '';
  return `${receiver}${phone}${addr.address ? ` | ${addr.address}` : ''}`.trim();
};

export default function ConfirmOrderModal({
  isOpen, onClose, restaurantName, items, total, addresses,
  defaultReceiver, defaultPhone, isSubmitting, error, onConfirm
}) {
  const { address: contextAddress } = useContext(AddressContext);
  const { user, loginUser } = useAuth();
  const manualFormRef = useRef(null);
  const [shouldSaveAddress, setShouldSaveAddress] = useState(false);
  
  const { handleDetectLocation } = useAddressSearch({
    onSelect: (data) => {
      setManualAddress(prev => ({ ...prev, full: data.full, location: data.location }));
    }
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [useManual, setUseManual] = useState(false);
  const [manualAddress, setManualAddress] = useState({ 
    receiver: defaultReceiver || '', 
    phone: defaultPhone || '', 
    building: '', note: '', full: '', location: null 
  });

  const normalizedAddresses = useMemo(
    () => (addresses || [])
      .map((addr) => normalizeAddress(addr, { receiver: defaultReceiver, phone: defaultPhone }))
      .filter((addr) => addr && addr.address),
    [addresses, defaultReceiver, defaultPhone]
  );

  // Logic: Khi mở Modal, thiết lập giá trị mặc định
  useEffect(() => {
    if (!isOpen) return;

    if (normalizedAddresses.length > 0) {
      setUseManual(false);
      setSelectedIndex(0);
    } else {
      setUseManual(true);
    }

    // Default: Context (LocalStorage) > Auto Detect
    if (contextAddress?.full) {
      setManualAddress(prev => ({
        ...prev,
        full: contextAddress.full,
        location: contextAddress.location
      }));
    } else {
      handleDetectLocation();
    }
  }, [isOpen, normalizedAddresses.length, contextAddress]);

  const handleManualAddressChange = (_, updatedData) => {
    setManualAddress(prev => ({ ...prev, ...updatedData }));
  };

  const isPhoneValid = (phone) => /^\d{10}$/.test(phone);

  const resolvedAddress = useManual ? {
    ...manualAddress,
    address: manualAddress.full // Khớp với field address của backend
  } : normalizedAddresses[selectedIndex];

  const canConfirm = 
    resolvedAddress?.address && 
    resolvedAddress?.receiver &&
    (useManual ? isPhoneValid(resolvedAddress?.phone) : !!resolvedAddress?.phone) && 
    !isSubmitting;

  const handleConfirmOrder = async () => {
    if (!canConfirm) return;

    // Nếu người dùng chọn nhập mới và tích vào "Lưu địa chỉ"
    if (useManual && shouldSaveAddress) {
      try {
        const newAddressObj = {
          building: manualAddress.building,
          note: manualAddress.note,
          full: manualAddress.full,
          location: manualAddress.location,
        };
        const updatedUser = await updateAddresses([...(addresses || []), newAddressObj]);
        if (updatedUser) {
          loginUser(updatedUser);
          toast.success("Đã lưu địa chỉ mới vào sổ địa chỉ!");
        }
      } catch (error) {
        console.error("Không thể lưu địa chỉ:", error);
        toast.error("Lỗi khi lưu địa chỉ mới.");
      }
    }
    onConfirm(resolvedAddress);
    setShouldSaveAddress(false);
  };

  const handleClose = async () => {
    setShouldSaveAddress(false);
    onClose();
  };

  if (!isOpen) return null;

  // const canConfirm = resolvedAddress?.address && resolvedAddress?.phone && !isSubmitting;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Xác nhận đặt hàng</h3>
          <button 
            className={styles.closeButton} 
            onClick={handleClose}><X size={18} 
          />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Nhà hàng: {restaurantName}</div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Món đã chọn</div>
            <div className={styles.itemList}>
              {items.map((item, idx) => (
                <div key={idx} className={styles.itemRow}>
                  <div className={styles.itemMain}>
                    <div className={styles.itemTextContent}>
                      <span className={styles.itemName}>{item.itemName || item.name}</span>
                      {item.options && item.options.length > 0 && (
                        <div className={styles.itemOptionsList}>
                          {item.options.map((opt, optIdx) => (
                            <span key={optIdx} className={styles.optionTag}>
                              {opt.label}{optIdx < item.options.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={styles.itemQty}>x{item.quantity}</span>
                  </div>
                  <span className={styles.itemPrice}>
                    {(item.priceSnapshot || item.snapshotPrice || 0).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.totalRow}><span>Tổng cộng</span><strong>{total}</strong></div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Địa chỉ giao hàng</div>
            <div className={styles.addressList}>
              {normalizedAddresses.map((addr, idx) => (
                <label key={idx} className={styles.addressOption}>
                  <input 
                    type="radio" 
                    checked={!useManual && selectedIndex === idx} 
                    onChange={() => {setUseManual(false); setSelectedIndex(idx);}} 
                  />
                  <span>{formatAddressLabel(addr)}</span>
                </label>
              ))}
              <label className={styles.addressOption}>
                <input 
                  type="radio" 
                  checked={useManual} 
                  onChange={() => setUseManual(true)} 
                />
                <span>Nhập địa chỉ khác</span>
              </label>
            </div>

            {useManual && (
              <div className={styles.manualForm} ref={manualFormRef}>
                <div className={styles.formRow}>
                  <input 
                    type="text" 
                    placeholder="Người nhận" 
                    value={manualAddress.receiver} 
                    onChange={(e) => setManualAddress(p => ({ ...p, receiver: e.target.value }))} 
                  />
                  <input 
                    type="text" 
                    placeholder="SĐT (10 số)" 
                    maxLength={10} // Giới hạn nhập 10 ký tự
                    value={manualAddress.phone} 
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d+$/.test(val)) {
                            setManualAddress(p => ({ ...p, phone: val }));
                        }
                    }} 
                  />
                </div>
                
                {/* Thông báo lỗi nếu SĐT chưa đủ 10 số */}
                {manualAddress.phone && manualAddress.phone.length !== 10 && (
                    <span className={styles.validationError}>Số điện thoại phải đủ 10 chữ số</span>
                )}

                <AddressItem 
                  addr={manualAddress} 
                  index={0}
                  onChange={handleManualAddressChange} 
                />

                {/* Ô Checkbox lưu địa chỉ */}
                <label className={styles.saveAddressOption}>
                    <input 
                        type="checkbox" 
                        checked={shouldSaveAddress} 
                        onChange={(e) => setShouldSaveAddress(e.target.checked)} 
                    />
                    <span>Lưu địa chỉ này vào sổ địa chỉ của tôi</span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.cancelButton} 
            onClick={handleClose}
            >
              Hủy
            </button>
          <button 
            className={styles.confirmButton} 
            onClick={handleConfirmOrder}
            disabled={!canConfirm}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}