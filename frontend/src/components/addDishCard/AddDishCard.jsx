import React, { useState, useEffect } from 'react';
import { X, UploadCloud, Loader2, Plus, Trash2, ChevronRight } from 'lucide-react';
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

const SUGGESTIONS = {
    'Trà Sữa': [
        { 
            groupName: 'Mức đường', 
            isRequired: true, 
            options: [
                { label: '100% đường', extraPrice: 0 }, { label: '70% đường', extraPrice: 0 },
                { label: '50% đường', extraPrice: 0 },{ label: '0% đường', extraPrice: 0 }
            ] 
        },
        { 
            groupName: 'Mức đá', 
            isRequired: true, 
            options: [
                { label: 'Đá bình thường', extraPrice: 0 }, { label: 'Ít đá', extraPrice: 0 },
                { label: 'Không đá', extraPrice: 0 }
            ] 
        },
        { 
            groupName: 'Topping', 
            isRequired: false, 
            options: [
                { label: 'Trân châu đen', extraPrice: 5000 }, { label: 'Trân châu trắng', extraPrice: 7000 },
                { label: 'Thạch củ năng', extraPrice: 8000 }, { label: 'Kem Cheese', extraPrice: 10000 }
            ] 
        }
    ],
    'Cà Phê': [
        { 
            groupName: 'Tùy chọn sữa', 
            isRequired: true, 
            options: [
                { label: 'Sữa đặc', extraPrice: 0 }, { label: 'Sữa tươi', extraPrice: 3000 },
                { label: 'Không sữa (Đen)', extraPrice: 0 }
            ] 
        },
        { 
            groupName: 'Thêm shot Espresso', 
            isRequired: false, 
            options: [{ label: 'Thêm 1 shot', extraPrice: 15000 }] 
        }
    ],
    'Cơm': [
        { 
            groupName: 'Món ăn kèm', 
            isRequired: false, 
            options: [
                { label: 'Thêm Trứng ốp la', extraPrice: 5000 }, { label: 'Thêm Chả chưng', extraPrice: 7000 },
                { label: 'Thêm Lạp xưởng', extraPrice: 10000 }
            ] 
        },
        { 
            groupName: 'Lựa chọn thêm', 
            isRequired: false, 
            options: [
                { label: 'Thêm Cơm thêm', extraPrice: 5000 }, { label: 'Thêm Canh', extraPrice: 3000 }
            ] 
        }
    ],
    'Burger': [
        { 
            groupName: 'Thêm nhân (Topping)', 
            isRequired: false, 
            options: [
                { label: 'Thêm Phô mai lát', extraPrice: 10000 }, { label: 'Thêm Thịt bò', extraPrice: 25000 },
                { label: 'Thêm Thịt xông khói', extraPrice: 15000 }, { label: 'Thêm Trứng', extraPrice: 5000 }
            ] 
        },
        { 
            groupName: 'Loại sốt', 
            isRequired: false, 
            options: [
                { label: 'Sốt Mayonnaise', extraPrice: 0 },{ label: 'Sốt BBQ', extraPrice: 0 },
                { label: 'Sốt Cay', extraPrice: 0 }
            ] 
        }
    ],
    'Pizza': [
        { 
            groupName: 'Kích thước', 
            isRequired: true, 
            options: [
                { label: 'Size S (6 inch)', extraPrice: 0 }, { label: 'Size M (9 inch)', extraPrice: 50000 },
                { label: 'Size L (12 inch)', extraPrice: 90000 }
            ] 
        },
        { 
            groupName: 'Đế bánh', 
            isRequired: true, 
            options: [
                { label: 'Đế dày xốp', extraPrice: 0 }, { label: 'Đế mỏng giòn', extraPrice: 0 },
                { label: 'Đế viền phô mai', extraPrice: 30000 }
            ] 
        }
    ],
    'Mì & Phở': [
        { 
            groupName: 'Lựa chọn sợi', 
            isRequired: true, 
            options: [
                { label: 'Sợi bình thường', extraPrice: 0 }, { label: 'Sợi mềm', extraPrice: 0 },
                { label: 'Sợi dai', extraPrice: 0 }
            ] 
        },
        { 
            groupName: 'Đồ ăn thêm', 
            isRequired: false, 
            options: [
                { label: 'Thêm Thịt', extraPrice: 15000 }, { label: 'Thêm Bò viên', extraPrice: 10000 },
                { label: 'Thêm Trứng chần', extraPrice: 7000 }, { label: 'Thêm Tiết', extraPrice: 5000 }
            ] 
        }
    ],
    'Bánh Mì': [
        { 
            groupName: 'Tùy chọn rau/vị', 
            isRequired: false, 
            options: [
                { label: 'Không lấy ớt', extraPrice: 0 }, { label: 'Không lấy hành lá', extraPrice: 0 },
                { label: 'Không lấy đồ chua', extraPrice: 0 }, { label: 'Nhiều bơ/patê', extraPrice: 0 }
            ] 
        },
        { 
            groupName: 'Thêm nhân', 
            isRequired: false, 
            options: [
                { label: 'Thêm Chả', extraPrice: 7000 }, { label: 'Thêm Thịt nguội', extraPrice: 7000 },
                { label: 'Thêm Trứng ốp la', extraPrice: 5000 }
            ] 
        }
    ],
    'Nước Ép': [
        { 
            groupName: 'Độ ngọt', 
            isRequired: true, 
            options: [
                { label: 'Ngọt bình thường', extraPrice: 0 }, { label: 'Ít đường', extraPrice: 0 },
                { label: 'Không đường (Nguyên chất)', extraPrice: 0 }
            ] 
        }
    ]
};

const DishModal = ({ isOpen, onClose, onSubmit, editingItem, isUploading }) => {
    const [formData, setFormData] = useState({
        name: '', price: '', stock: '', category: CATEGORIES[0].value, description: '', image: null, available: true, customization: []
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
                available: editingItem.available ?? true,
                customization: editingItem.customization || []
            });
            setPreviewImage(editingItem.images?.[0] || null);
        } else {
            setFormData({ name: '', price: '', stock: '', category: CATEGORIES[0].value, description: '', image: null, available: true, customization: [] });
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

    const addCustomGroup = (suggestion = null) => {
        const newGroup = suggestion || { groupName: '', isRequired: false, options: [{ label: '', extraPrice: 0 }] };
        setFormData({ ...formData, customization: [...formData.customization, newGroup] });
    };

    const removeCustomGroup = (index) => {
        const updated = formData.customization.filter((_, i) => i !== index);
        setFormData({ ...formData, customization: updated });
    };

    const updateGroup = (index, field, value) => {
        const updated = [...formData.customization];
        updated[index][field] = value;
        setFormData({ ...formData, customization: updated });
    };

    const addOption = (groupIndex) => {
        const updated = [...formData.customization];
        updated[groupIndex].options.push({ label: '', extraPrice: 0, available: true });
        setFormData({ ...formData, customization: updated });
    };

    const updateOption = (groupIndex, optIndex, field, value) => {
        const updated = [...formData.customization];
        updated[groupIndex].options[optIndex][field] = value;
        setFormData({ ...formData, customization: updated });
    };

    const removeOption = (groupIndex, optIndex) => {
        const updated = [...formData.customization];
        updated[groupIndex].options = updated[groupIndex].options.filter((_, i) => i !== optIndex);
        setFormData({ ...formData, customization: updated });
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
        data.append('customization', JSON.stringify(formData.customization));

        onSubmit(data);
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalBody} onClick={e => e.stopPropagation()}>
                <div className={styles.modalContentWrapper}>
                    {/* CỘT TRÁI: THÔNG TIN CƠ BẢN */}
                    <div className={styles.mainFormSide}>
                        <div className={styles.modalHeader}>
                            <h3>{editingItem ? 'Cập nhật món ăn' : 'Thêm món ăn mới'}</h3>
                        </div>
                        <form id="dish-form" onSubmit={handleFormSubmit} className={styles.menuForm}>
                            <div className={styles.imageUploadSection}>
                                <label className={styles.uploadLabel}>
                                    {previewImage ? <img src={previewImage} alt="Preview" className={styles.previewImg} /> : 
                                    <div className={styles.uploadPlaceholder}><UploadCloud size={32} /><span>Tải ảnh</span></div>}
                                    <input type="file" accept="image/*" onChange={(e) => {
                                        const file = e.target.files[0];
                                        if(file) { setFormData({...formData, image: file}); setPreviewImage(URL.createObjectURL(file)); }
                                    }} hidden />
                                </label>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Tên món & Giá</label>
                                <div className={styles.formRow}>
                                    <input type="text" placeholder="Tên món" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    <input type="number" placeholder="Giá VNĐ" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Danh mục</label>
                                    <select value={isOtherCategory ? 'other' : formData.category} onChange={(e) => {
                                        const val = e.target.value;
                                        setIsOtherCategory(val === 'other');
                                        setFormData({...formData, category: val === 'other' ? '' : val});
                                    }}>
                                        {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Kho hàng</label>
                                    <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                                </div>
                            </div>
                            
                            {isOtherCategory && (
                                <div className={styles.formGroup}>
                                    <input type="text" placeholder="Nhập danh mục mới..." value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required />
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label>Mô tả</label>
                                <textarea rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </div>
                        </form>
                    </div>

                    {/* CỘT PHẢI: CUSTOMIZATION */}
                    <div className={styles.customSide}>
                        <div className={styles.customHeader}>
                            <h3>Tùy chỉnh (Topping, Size...)</h3>
                            <button type="button" className={styles.btnAddGroup} onClick={() => addCustomGroup()}>
                                <Plus size={16} /> Thêm nhóm
                            </button>
                        </div>

                        {/* Gợi ý nhanh */}
                        {SUGGESTIONS[formData.category] && formData.customization.length === 0 && (
                            <div className={styles.suggestionBox}>
                                <label>Gợi ý cho {formData.category}:</label>
                                <div className={styles.suggestionChips}>
                                    {SUGGESTIONS[formData.category].map((s, idx) => (
                                        <button key={idx} type="button" onClick={() => addCustomGroup(s)}>+ {s.groupName}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={styles.customScrollArea}>
                            {formData.customization.map((group, gIdx) => (
                                <div key={gIdx} className={styles.customGroupCard}>
                                    <div className={styles.groupHeader}>
                                        <input 
                                            className={styles.groupNameInput}
                                            placeholder="Tên nhóm (VD: Chọn Size)" 
                                            value={group.groupName}
                                            onChange={(e) => updateGroup(gIdx, 'groupName', e.target.value)}
                                        />
                                        <label className={styles.checkboxLabel}>
                                            <input type="checkbox" checked={group.isRequired} onChange={(e) => updateGroup(gIdx, 'isRequired', e.target.checked)} />
                                            Bắt buộc
                                        </label>
                                        <button type="button" onClick={() => removeCustomGroup(gIdx)} className={styles.btnDelete}><Trash2 size={20}/></button>
                                    </div>

                                    {group.options.map((opt, oIdx) => (
                                        <div key={oIdx} className={styles.optionRow}>
                                            <input placeholder="Tên lựa chọn" value={opt.label} onChange={(e) => updateOption(gIdx, oIdx, 'label', e.target.value)} />
                                            <input type="number" placeholder="+0đ" value={opt.extraPrice} onChange={(e) => updateOption(gIdx, oIdx, 'extraPrice', e.target.value)} />
                                            <button type="button"
                                                className={`${styles.toggleOptBtn} ${opt.available ? styles.optIn : styles.optOut}`}
                                                onClick={() => updateOption(gIdx, oIdx, 'available', !opt.available)}
                                                title={opt.available ? "Đang có hàng" : "Hết hàng"}
                                            >
                                                {opt.available ? 'Đang bán' : 'Hết hàng'}
                                            </button>
                                            <button type="button" onClick={() => removeOption(gIdx, oIdx) } className={styles.btnDelete}><Trash2 size={18}/></button>
                                        </div>
                                    ))}
                                    <button type="button" className={styles.btnAddOpt} onClick={() => addOption(gIdx)}>+ Thêm lựa chọn</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button type="button" className={styles.btnCancel} onClick={onClose}>Hủy</button>
                    <button type="submit" form="dish-form" className={styles.btnSave} disabled={isUploading}>
                        {isUploading ? <Loader2 className={styles.spin} /> : 'Xác nhận lưu món'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DishModal;

{/* <div className={styles.modalBody} onClick={e => e.stopPropagation()}>
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
            </div> */}