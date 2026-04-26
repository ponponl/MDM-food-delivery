import React, { useState, useEffect } from 'react';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import styles from './AddDishCard.module.css';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'Burger', label: 'Burger' },
  { value: 'Pizza', label: 'Pizza' },
  { value: 'Cơm', label: 'Cơm' },
  { value: 'Mì & Phở', label: 'Mì & Phở' },
  { value: 'Bánh Mì', label: 'Bánh Mì' },
  { value: 'Cà Phê', label: 'Cà Phê' },
  { value: 'Trà Sữa', label: 'Trà Sữa' },
  { value: 'Nước Ép', label: 'Nước Ép' },
  { value: 'Bánh Ngọt', label: 'Bánh Ngọt' },
  { value: 'other', label: 'Khác (Tự nhập...)' }
];

const DishModal = ({ isOpen, onClose, onSubmit, editingItem, isUploading }) => {
    const [formData, setFormData] = useState({
        name: '', price: '', stock: '', category: CATEGORIES[0].value, description: '', image: null, available: true
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [isOtherCategory, setIsOtherCategory] = useState(false);

    // Đồng bộ dữ liệu khi mở Modal ở chế độ Chỉnh sửa
    useEffect(() => {
        if (editingItem) {
            const isStandard = CATEGORIES.some(cat => cat.value === editingItem.category);
            setIsOtherCategory(!isStandard);
            setFormData({
                name: editingItem.name || '',
                price: editingItem.price || '',
                stock: editingItem.stock || '',
                category: editingItem.category || CATEGORIES[0].value,
                description: editingItem.description || '',
                image: null,
                available: editingItem.available ?? true
            });
            setPreviewImage(editingItem.images?.[0] || null);
        } else {
            setFormData({ name: '', price: '', stock: '', category: CATEGORIES[0].value, description: '', image: null, available: true });
            setPreviewImage(null);
        }
    }, [editingItem, isOpen]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        if (value === 'other') {
            setIsOtherCategory(true);
            setFormData({ ...formData, category: '' });
        } else {
            setIsOtherCategory(false);
            setFormData({ ...formData, category: value });
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        // Kiểm tra logic nếu là thêm mới thì bắt buộc có ảnh
        if (!editingItem && !formData.image) return toast.error("Vui lòng chọn ảnh món ăn!");

        const data = new FormData();
        if (formData.image) data.append('image', formData.image);
        data.append('name', formData.name);
        data.append('price', formData.price);
        data.append('stock', formData.stock);
        data.append('category', formData.category);
        data.append('description', formData.description);
        data.append('available', formData.available);

        onSubmit(data);
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalBody} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>{editingItem ? 'Cập nhật món ăn' : 'Thêm món ăn mới'}</h3>
                </div>

                <form onSubmit={handleFormSubmit} className={styles.menuForm}>
                    <div className={styles.imageUploadSection}>
                        <label className={styles.uploadLabel}>
                            {previewImage ? (
                                <img src={previewImage} alt="Preview" className={styles.previewImg} />
                            ) : (
                                <div className={styles.uploadPlaceholder}>
                                    <UploadCloud size={40} />
                                    <span>Nhấn để tải ảnh món ăn</span>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                        </label>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Tên món ăn</label>
                        <input type="text" required value={formData.name} 
                               onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Giá (VNĐ)</label>
                            <input type="number" required value={formData.price}
                                   onChange={e => setFormData({...formData, price: e.target.value})} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Số lượng có sẵn</label>
                            <input type="number" required value={formData.stock}
                                   onChange={e => setFormData({...formData, stock: e.target.value})} />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Danh mục</label>
                        <select 
                            value={isOtherCategory ? 'other' : formData.category} 
                            onChange={handleCategoryChange}
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    {isOtherCategory && (
                        <div className={styles.formGroup} style={{ marginTop: '-10px' }}>
                            <input 
                                type="text" 
                                placeholder="Nhập danh mục mới của bạn..." 
                                value={formData.category} 
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                                autoFocus
                            />
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label>Trạng thái món ăn</label>
                        <select 
                            value={formData.available.toString()}
                            onChange={e => setFormData({...formData, available: e.target.value === 'true'})}
                        >
                            <option value="true">Đang bán</option>
                            <option value="false">Tạm ngưng</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Mô tả món ăn</label>
                        <textarea rows="3" value={formData.description} 
                                  onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>

                    <div className={styles.modalButtons}>
                        <button type="button" className={styles.btnCancel} onClick={onClose}>Hủy</button>
                        <button type="submit" className={styles.btnSave} disabled={isUploading}>
                            {isUploading ? <Loader2 className={styles.spin} /> : 'Xác nhận'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DishModal;