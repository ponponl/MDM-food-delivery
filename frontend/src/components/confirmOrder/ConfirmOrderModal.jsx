import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import styles from './ConfirmOrderModal.module.css';

const normalizeAddress = (addr, defaults) => {
  if (!addr) return null;
  if (typeof addr === 'string') {
    return { receiver: defaults?.receiver || '', phone: defaults?.phone || '', address: addr };
  }
  const addressText =
    addr.address ||
    addr.full ||
    addr.value ||
    [addr.street, addr.city].filter(Boolean).join(', ');
  return {
    receiver: addr.receiver || addr.name || defaults?.receiver || '',
    phone: addr.phone || addr.phoneNumber || defaults?.phone || '',
    address: addressText || ''
  };
};

const formatAddressLabel = (addr) => {
  const receiver = addr.receiver ? `${addr.receiver}` : '';
  const phone = addr.phone ? ` - ${addr.phone}` : '';
  return `${receiver}${phone}${addr.address ? ` | ${addr.address}` : ''}`.trim();
};

export default function ConfirmOrderModal({
  isOpen,
  onClose,
  restaurantName,
  items,
  total,
  addresses,
  defaultReceiver,
  defaultPhone,
  isSubmitting,
  error,
  onConfirm
}) {
  const normalizedAddresses = useMemo(
    () => (addresses || [])
      .map((addr) => normalizeAddress(addr, { receiver: defaultReceiver, phone: defaultPhone }))
      .filter((addr) => addr && addr.address),
    [addresses, defaultReceiver, defaultPhone]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [useManual, setUseManual] = useState(false);
  const [manualAddress, setManualAddress] = useState({ receiver: '', phone: '', address: '' });

  useEffect(() => {
    if (!isOpen) return;
    if (normalizedAddresses.length > 0) {
      setSelectedIndex(0);
      setUseManual(false);
    } else {
      setUseManual(true);
    }
    setManualAddress({ receiver: '', phone: '', address: '' });
  }, [isOpen, normalizedAddresses.length]);

  if (!isOpen) return null;

  const selectedAddress = !useManual ? normalizedAddresses[selectedIndex] : null;
  const resolvedAddress = useManual ? manualAddress : selectedAddress;
  const canConfirm =
    resolvedAddress &&
    resolvedAddress.address &&
    resolvedAddress.phone &&
    resolvedAddress.receiver &&
    items?.length > 0 &&
    !isSubmitting;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm?.(resolvedAddress);
  };

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Confirm order"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h3>Xác nhận đặt hàng</h3>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Nhà hàng</div>
            <div className={styles.restaurantName}>{restaurantName || 'Nha hang'}</div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Món đã chọn</div>
            <div className={styles.itemList}>
              {(items || []).map((item) => (
                <div key={item.itemKey || item.itemId} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    {item.image ? (
                      <img
                        className={styles.itemImage}
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                      />
                    ) : (
                      <span className={styles.itemPlaceholder}>Ảnh</span>
                    )}
                    <div className={styles.itemName}>{item.name}</div>
                  </div>
                  <div className={styles.itemMeta}>x{item.quantity}</div>
                  <div className={styles.itemPrice}>{item.subtotal}</div>
                </div>
              ))}
            </div>
            <div className={styles.totalRow}>
              <span>Tổng tiền</span>
              <strong>{total}</strong>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Địa chỉ giao hàng</div>
            {normalizedAddresses.length > 0 && (
              <div className={styles.addressList}>
                {normalizedAddresses.map((addr, index) => (
                  <label key={`${addr.address}-${index}`} className={styles.addressOption}>
                    <input
                      type="radio"
                      name="address"
                      checked={!useManual && selectedIndex === index}
                      onChange={() => {
                        setUseManual(false);
                        setSelectedIndex(index);
                      }}
                    />
                    <span>{formatAddressLabel(addr)}</span>
                  </label>
                ))}
                <label className={styles.addressOption}>
                  <input
                    type="radio"
                    name="address"
                    checked={useManual}
                    onChange={() => setUseManual(true)}
                  />
                  <span>Nhập địa chỉ khác</span>
                </label>
              </div>
            )}

            {(useManual || normalizedAddresses.length === 0) && (
              <div className={styles.manualForm}>
                <input
                  type="text"
                  placeholder="Người nhận"
                  value={manualAddress.receiver}
                  onChange={(event) =>
                    setManualAddress((prev) => ({ ...prev, receiver: event.target.value }))
                  }
                />
                <input
                  type="text"
                  placeholder="Số điện thoại"
                  value={manualAddress.phone}
                  onChange={(event) =>
                    setManualAddress((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
                <textarea
                  rows={3}
                  placeholder="Địa chỉ giao hàng"
                  value={manualAddress.address}
                  onChange={(event) =>
                    setManualAddress((prev) => ({ ...prev, address: event.target.value }))
                  }
                />
              </div>
            )}
          </div>
        </div>

        {error && <div className={styles.errorText}>{error}</div>}

        <div className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
          </button>
        </div>
      </div>
    </div>
  );
}
