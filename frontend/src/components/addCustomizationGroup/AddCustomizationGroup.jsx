import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, Settings2 } from 'lucide-react';
import styles from './AddCustomizationGroup.module.css';
import toast from 'react-hot-toast';

const AddCustomizationGroup = ({ isOpen, onClose, onSubmit, editingGroup, isUploading }) => {
    const [formData, setFormData] = useState({
        groupName: '',
        isRequired: false,
        options: [{ label: '', extraPrice: 0, available: true }]
    });

    useEffect(() => {
        if (editingGroup) {
            setFormData({
                groupName: editingGroup.groupName || '',
                isRequired: editingGroup.isRequired || false,
                options: editingGroup.options?.length > 0 
                    ? editingGroup.options.map(opt => ({ ...opt })) 
                    : [{ label: '', extraPrice: 0 }]
            });
        } else {
            setFormData({
                groupName: '',
                isRequired: false,
                options: [{ label: '', extraPrice: 0 }]
            });
        }
    }, [editingGroup, isOpen]);

    if (!isOpen) return null;

    const handleAddOption = () => {
        setFormData({
            ...formData,
            options: [...formData.options, { label: '', extraPrice: 0, available: true }]
        });
    };

    const handleRemoveOption = (index) => {
        if (formData.options.length === 1) {
            toast.error("Phải có ít nhất một lựa chọn");
            return;
        }
        const newOptions = formData.options.filter((_, i) => i !== index);
        setFormData({ ...formData, options: newOptions });
    };

    const handleOptionChange = (index, field, value) => {
        const newOptions = [...formData.options];
        newOptions[index][field] = field === 'extraPrice' ? Number(value) : value;
        setFormData({ ...formData, options: newOptions });
    };

    const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.groupName.trim()) {
        toast.error("Vui lòng nhập tên nhóm");
        return;
    }
    if (formData.options.some(opt => !opt.label.trim())) {
        toast.error("Vui lòng điền đầy đủ tên các lựa chọn");
        return;
    }
    onSubmit(formData);
};

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalBody} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>{editingGroup ? 'Cập nhật nhóm tùy chỉnh' : 'Tạo nhóm tùy chỉnh mới'}</h3>
                    <button className={styles.btnClose} onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.mainForm}>
                    <div className={styles.formSection}>
                        <div className={styles.formGroup}>
                            <label>Tên nhóm tùy chỉnh</label>
                            <input 
                                type="text" 
                                placeholder="VD: Mức đường, Topping..." 
                                value={formData.groupName}
                                onChange={e => setFormData({...formData, groupName: e.target.value})}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.checkboxLabel}>
                                <input 
                                    type="checkbox" 
                                    checked={formData.isRequired}
                                    onChange={e => setFormData({...formData, isRequired: e.target.checked})}
                                />
                                <span>Bắt buộc khách hàng phải chọn</span>
                            </label>
                            <p className={styles.helperText}>Nếu chọn, khách phải chọn ít nhất 1 lựa chọn mới có thể đặt món.</p>
                        </div>
                    </div>

                    <div className={styles.optionsSection}>
                        <div className={styles.sectionHeader}>
                            <label>Danh sách lựa chọn</label>
                            <button type="button" className={styles.btnAddOption} onClick={handleAddOption}>
                                <Plus size={16} /> Thêm dòng
                            </button>
                        </div>

                        <div className={styles.optionsScrollArea}>
                            {formData.options.map((opt, idx) => (
                                <div key={idx} className={styles.optionRow}>
                                    <div className={styles.optInputGroup}>
                                        <input 
                                            type="text" 
                                            placeholder="Tên (VD: Trân châu)" 
                                            value={opt.label}
                                            onChange={e => handleOptionChange(idx, 'label', e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.optPriceGroup}>
                                        <input 
                                            type="number" 
                                            placeholder="Giá thêm" 
                                            value={opt.extraPrice}
                                            onChange={e => handleOptionChange(idx, 'extraPrice', e.target.value)}
                                        />
                                        <span className={styles.currency}>đ</span>
                                    </div>
                                    <button 
                                        type="button"
                                        className={`${styles.toggleOptBtn} ${opt.available ? styles.optIn : styles.optOut}`}
                                        onClick={() => handleOptionChange(idx, 'available', !opt.available)}
                                    >
                                        {opt.available ? 'BÁN' : 'HẾT'}
                                    </button>

                                    <button 
                                        type="button" 
                                        className={styles.btnDeleteOpt}
                                        onClick={() => handleRemoveOption(idx)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.btnCancel} onClick={onClose}>Hủy</button>
                        <button type="submit" className={styles.btnSave} disabled={isUploading}>
                            {isUploading ? <Loader2 className={styles.spin} /> : 'Lưu nhóm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCustomizationGroup;
