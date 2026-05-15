import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, ShoppingCart, Check } from 'lucide-react';
import styles from './OptionSelectionModal.module.css';

const DishSelectionModal = ({ isOpen, onClose, item, onConfirm }) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [totalPrice, setTotalPrice] = useState(0);

    // Khởi tạo state khi mở modal hoặc thay đổi món
    useEffect(() => {
        if (isOpen && item) {
            setQuantity(1);
            const initialOptions = {};
            // Với các nhóm bắt buộc, ta có thể mặc định chọn option đầu tiên hoặc để trống
            item.customization?.forEach(group => {
                initialOptions[group._id || group.groupName] = group.isRequired ? null : [];
            });
            setSelectedOptions(initialOptions);
        }
    }, [isOpen, item]);

    // Tính toán tổng tiền khi thay đổi lựa chọn hoặc số lượng
    useEffect(() => {
        if (!item) return;

        let extra = 0;
        Object.values(selectedOptions).forEach(val => {
            if (Array.isArray(val)) {
                val.forEach(opt => extra += (opt.extraPrice || 0));
            } else if (val) {
                extra += (val.extraPrice || 0);
            }
        });

        setTotalPrice((item.price + extra) * quantity);
    }, [selectedOptions, quantity, item]);

    if (!isOpen || !item) return null;

    const handleOptionSelect = (group, option) => {
        const groupId = group._id || group.groupName;
        
        setSelectedOptions(prev => {
            if (group.isRequired) {
                // Nhóm bắt buộc: thường là Radio (chọn 1)
                return { ...prev, [groupId]: option };
            } else {
                // Nhóm không bắt buộc: Checkbox (chọn nhiều)
                const current = prev[groupId] || [];
                const isSelected = current.find(o => o.label === option.label);
                
                if (isSelected) {
                    return { ...prev, [groupId]: current.filter(o => o.label !== option.label) };
                } else {
                    return { ...prev, [groupId]: [...current, option] };
                }
            }
        });
    };

    const isGroupValid = (group) => {
        if (!group.isRequired) return true;
        const selection = selectedOptions[group._id || group.groupName];
        return selection !== null && selection !== undefined;
    };

    const allRequiredSelected = item.customization?.every(isGroupValid);

    const handleConfirm = () => {
        if (!allRequiredSelected) return;
        
        // Flatten selections for final cart item
        const finalCustomizations = [];
        Object.entries(selectedOptions).forEach(([groupId, value]) => {
            if (Array.isArray(value)) {
                if (value.length > 0) {
                    const group = item.customization.find(g => (g._id || g.groupName) === groupId);
                    finalCustomizations.push({ ...group, options: value });
                }
            } else if (value) {
                const group = item.customization.find(g => (g._id || g.groupName) === groupId);
                finalCustomizations.push({ ...group, options: [value] });
            }
        });

        onConfirm({
            ...item,
            quantity,
            selectedCustomizations: finalCustomizations,
            finalPrice: totalPrice / quantity, // Giá đơn vị gồm cả topping
            totalAmount: totalPrice
        });
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={24} />
                </button>

                <div className={styles.header}>
                    <div className={styles.imageContainer}>
                        <img src={item.images?.[0]} alt={item.name} className={styles.dishImage} />
                    </div>
                    <div className={styles.dishInfo}>
                        <h2 className={styles.dishName}>{item.name}</h2>
                        <p className={styles.dishDesc}>{item.description}</p>
                        <span className={styles.basePrice}>{item.price?.toLocaleString()}đ</span>
                    </div>
                </div>

                <div className={styles.content}>
                    {item.customization?.map((group) => (
                        <div key={group._id || group.groupName} className={styles.customGroup}>
                            <div className={styles.groupHeader}>
                                <h4 className={styles.groupName}>
                                    {group.groupName}
                                    {group.isRequired && <span className={styles.requiredLabel}>(Bắt buộc)</span>}
                                </h4>
                                <span className={styles.groupHint}>
                                    {group.isRequired ? 'Chọn 1' : 'Chọn nhiều'}
                                </span>
                            </div>
                            
                            <div className={styles.optionsList}>
                                {group.options.map((opt, idx) => {
                                    const groupId = group._id || group.groupName;
                                    const isSelected = group.isRequired 
                                        ? selectedOptions[groupId]?.label === opt.label
                                        : selectedOptions[groupId]?.some(o => o.label === opt.label);
                                    
                                    return (
                                        <div 
                                            key={idx} 
                                            className={`${styles.optionItem} ${isSelected ? styles.optionSelected : ''} ${!opt.available ? styles.optionDisabled : ''}`}
                                            onClick={() => opt.available && handleOptionSelect(group, opt)}
                                        >
                                            <div className={styles.optionMain}>
                                                <div className={`${styles.selector} ${group.isRequired ? styles.radio : styles.checkbox}`}>
                                                    {isSelected && <Check size={14} strokeWidth={3} />}
                                                </div>
                                                <span className={styles.optionLabel}>{opt.label}</span>
                                            </div>
                                            <div className={styles.optionPrice}>
                                                {opt.extraPrice > 0 ? `+${opt.extraPrice.toLocaleString()}đ` : 'Miễn phí'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.footer}>
                    <div className={styles.quantityControls}>
                        <button 
                            className={styles.qtyBtn} 
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1}
                        >
                            <Minus size={18} />
                        </button>
                        <span className={styles.qtyValue}>{quantity}</span>
                        <button 
                            className={styles.qtyBtn} 
                            onClick={() => setQuantity(quantity + 1)}
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <button 
                        className={styles.submitBtn} 
                        onClick={handleConfirm}
                        disabled={!allRequiredSelected}
                    >
                        <span className={styles.btnText}>Thêm vào giỏ hàng</span>
                        <span className={styles.btnPrice}>{totalPrice.toLocaleString()}đ</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DishSelectionModal;
