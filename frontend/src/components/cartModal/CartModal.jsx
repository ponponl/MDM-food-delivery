import { useEffect, useMemo, useState } from 'react';
import { Trash2, Minus, Plus, X } from 'lucide-react';
import styles from './CartModal.module.css';

const buildGroups = (items = []) => {
  const groups = new Map();

  items.forEach((item) => {
    const key = item.restaurantId || 'unknown';
    const fallback = 'Nhà hàng';
    const label = item.restaurantName || fallback;
    const image = item.restaurantImage || null;
    if (!groups.has(key)) {
      groups.set(key, { id: key, label, image, items: [] });
    }
    groups.get(key).items.push(item);
  });

  return Array.from(groups.values());
};

export default function CartModal({
  isOpen,
  onClose,
  items = [],
  isLoading,
  error,
  isPlacingOrder,
  onIncrease,
  onDecrease,
  onRemoveItem,
  onRemoveRestaurant,
  onPlaceOrder,
  formatCurrency
}) {
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const groups = useMemo(() => buildGroups(items), [items]);

  useEffect(() => {
    if (!isOpen) return;
    if (!items.length) {
      setSelectedItemIds(new Set());
      setSelectedRestaurantId(null);
      return;
    }

    const firstRestaurantId = items[0]?.restaurantId || 'unknown';
    const next = new Set(
      items
        .filter((item) => (item.restaurantId || 'unknown') === firstRestaurantId)
        .map((item) => item.itemKey || item.itemId)
    );
    setSelectedRestaurantId(firstRestaurantId);
    setSelectedItemIds(next);
  }, [isOpen, items]);

  const isItemSelected = (itemKey) => selectedItemIds.has(itemKey);

  const toggleItem = (item, itemKey) => {
    const itemRestaurantId = item?.restaurantId || 'unknown';
    setSelectedItemIds((prev) => {
      let next = new Set(prev);

      if (selectedRestaurantId && selectedRestaurantId !== itemRestaurantId) {
        next = new Set();
      }

      if (selectedRestaurantId !== itemRestaurantId) {
        setSelectedRestaurantId(itemRestaurantId);
      }

      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }
      return next;
    });
  };

  const toggleGroup = (group) => {
    const groupIds = group.items.map((item) => item.itemKey || item.itemId);
    const allSelected = groupIds.every((id) => selectedItemIds.has(id));

    if (selectedRestaurantId && selectedRestaurantId !== group.id) {
      setSelectedRestaurantId(group.id);
      setSelectedItemIds(new Set(groupIds));
      return;
    }

    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupIds.forEach((id) => next.delete(id));
      } else {
        groupIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const selectedTotal = useMemo(() => {
    if (!items?.length) return 0;
    return items
      .filter((item) => selectedItemIds.has(item.itemKey || item.itemId))
      .reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }, [items, selectedItemIds]);

  const handlePlaceOrder = () => {
    if (!selectedRestaurantId || selectedItemIds.size === 0) return;
    onPlaceOrder?.({
      restaurantId: selectedRestaurantId,
      selectedItemIds: Array.from(selectedItemIds)
    });
  };

  const handleDecrease = (item) => {
    if (!item) return;
    if (item.quantity <= 1) {
      requestRemoveItem(item);
      return;
    }
    onDecrease?.(item);
  };

  const requestRemoveItem = (item) => {
    setConfirmAction({
      type: 'item',
      label: item?.name || 'mon an',
      payload: item
    });
  };

  const requestRemoveRestaurant = (group) => {
    setConfirmAction({
      type: 'group',
      label: group?.label || 'nha hang',
      payload: group
    });
  };

  const handleConfirmRemove = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'item') {
      await onRemoveItem?.(confirmAction.payload);
    }
    if (confirmAction.type === 'group') {
      await onRemoveRestaurant?.(confirmAction.payload);
    }
    setConfirmAction(null);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Cart modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h3>Giỏ hàng</h3>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close cart">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {isLoading && <div className={styles.stateText}>Đang tải giỏ hàng...</div>}
          {!isLoading && error && <div className={styles.errorText}>{error}</div>}

          {!isLoading && !error && items.length === 0 && (
            <div className={styles.stateText}>Giỏ hàng trống.</div>
          )}

          {!isLoading && !error && items.length > 0 && (
            <div className={styles.groupList}>
              {groups.map((group) => {
                const groupSelected = group.items.every((item) => isItemSelected(item.itemKey || item.itemId));
                return (
                  <div key={group.id} className={styles.groupBlock}>
                    <div className={styles.groupHeader}>
                      <label className={styles.checkboxRow}>
                        <input
                          type="checkbox"
                          checked={groupSelected}
                          onChange={() => toggleGroup(group)}
                        />
                        <span className={styles.groupInfo}>
                          {group.image ? (
                            <img
                              className={styles.groupImage}
                              src={group.image}
                              alt={group.label}
                              loading="lazy"
                            />
                          ) : (
                            <span className={styles.groupPlaceholder}>NH</span>
                          )}
                          <span className={styles.groupLabel}>{group.label}</span>
                        </span>
                      </label>
                      <button
                        type="button"
                        className={styles.trashButton}
                        onClick={() => requestRemoveRestaurant(group)}
                        aria-label="Remove restaurant"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className={styles.itemList}>
                      {group.items.map((item) => (
                        <div key={item.itemKey || item.itemId} className={styles.itemRow}>
                          <label className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              checked={isItemSelected(item.itemKey || item.itemId)}
                              onChange={() => toggleItem(item, item.itemKey || item.itemId)}
                            />
                            <span className={styles.itemInfo}>
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
                              <span className={styles.itemName}>{item.name}</span>
                            </span>
                          </label>

                          <div className={styles.qtyControls}>
                            <button
                              type="button"
                              className={styles.qtyButton}
                              onClick={() => handleDecrease(item)}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>
                            <span className={styles.qtyValue}>{item.quantity}</span>
                            <button
                              type="button"
                              className={styles.qtyButton}
                              onClick={() => onIncrease(item)}
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <div className={styles.itemPrice}>{formatCurrency(item.subtotal || 0)}</div>

                          <button
                            type="button"
                            className={styles.trashButton}
                            onClick={() => requestRemoveItem(item)}
                            aria-label="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {confirmAction && (
          <div className={styles.confirmOverlay} role="presentation">
            <div className={styles.confirmBox} role="dialog" aria-modal="true">
              <p className={styles.confirmText}>
                Bạn có chắc chắn muốn xóa {confirmAction.label}?
              </p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.confirmCancel}
                  onClick={() => setConfirmAction(null)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className={styles.confirmOk}
                  onClick={handleConfirmRemove}
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.totalRow}>
            <span>Tổng tiền</span>
            <strong>{formatCurrency(selectedTotal)}</strong>
          </div>
          <button
            type="button"
            className={styles.orderButton}
            onClick={handlePlaceOrder}
            disabled={selectedTotal === 0 || !selectedRestaurantId || isPlacingOrder}
          >
            {isPlacingOrder ? 'Đang đặt...' : 'Đặt hàng'}
          </button>
        </div>
      </div>
    </div>
  );
}
