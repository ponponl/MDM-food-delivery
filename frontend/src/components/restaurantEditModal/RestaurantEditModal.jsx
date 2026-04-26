import React, { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, Loader2, MapPin, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAddressSearch } from '../../hooks/useAddressSearch';
import AddressItem from "../../components/addressItem/addressItem";
import MapPicker from '../../components/mapPicker/MapPicker';
import styles from './RestaurantEditModal.module.css';

const CATEGORIES = [
  { value: 'burger', label: 'Burger' },
  { value: 'pizza', label: 'Pizza' },
  { value: 'com', label: 'Cơm' },
  { value: 'mi-pho', label: 'Mì & Phở' },
  { value: 'banh-mi', label: 'Bánh Mì' },
  { value: 'ca-phe', label: 'Cà Phê' },
  { value: 'tra-sua', label: 'Trà Sữa' },
  { value: 'nuoc-ep', label: 'Nước Ép' },
  { value: 'banh-ngot', label: 'Bánh Ngọt' }
];

const RestaurantEditModal = ({ isOpen, onClose, initialData, onSubmit, isUpdating }) => {
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const suggestionListRef = useRef(null);
    const [formData, setFormData] = useState({
        name: '', type: '', phone: '', openTime: '', closeTime: '', addressFull: null, image: null
    });
    const [preview, setPreview] = useState(null);

    const {
        address: displayAddress,
        suggestions,
        handleInputChange,
        handleKeyDown,
        activeSuggestionIndex,
        selectSuggestion,
        reverseGeocode,
        handleDetectLocation,
        setAddress: setDisplayAddress
    } = useAddressSearch({
        onSelect: (data) => {
            setFormData(prev => ({ ...prev, address: data }));
        }
    });

    useEffect(() => {
        if (initialData && isOpen) {
            setFormData({
                name: initialData.name || '',
                type: initialData.type || '',
                phone: initialData.phone || '',
                openTime: initialData.openTime || '',
                closeTime: initialData.closeTime || '',
                addressFull: initialData.address?.full || null,
                image: null
            });
            console.log(initialData.address);
            setPreview(initialData.images?.[0] || null);
            if (initialData.address?.full) {
                setDisplayAddress(initialData.address.full);
            }
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        if (activeSuggestionIndex >= 0 && suggestionListRef.current) {
            const activeItem = suggestionListRef.current.childNodes[activeSuggestionIndex];
            activeItem?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [activeSuggestionIndex]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'address') {
                data.append(key, JSON.stringify(formData[key]));
            } else if (formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });
        onSubmit(data);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalBody}>
                <div className={styles.modalHeader}>
                    <h3>Chỉnh sửa thông tin nhà hàng</h3>
                    <X className={styles.closeBtn} onClick={onClose} />
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Phần upload ảnh đại diện */}
                    <div className={styles.imageSection}>
                        <label className={styles.imageLabel}>
                            <img src={preview || '/src/assets/pizza.png'} alt="Preview" />
                            <input type="file" hidden onChange={e => {
                                const file = e.target.files[0];
                                setFormData({...formData, image: file});
                                setPreview(URL.createObjectURL(file));
                            }} />
                        </label>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Tên nhà hàng</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                        <label>Loại hình</label>
                            <select 
                                name="type" 
                                value={formData.type} 
                                onChange={handleChange}
                                className={styles.selectInput}
                            >
                                <option value="" disabled>-- Chọn danh mục --</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>                        
                        </div>
                        <div className={styles.formGroup}>
                            <label>Số điện thoại</label>
                            <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Giờ mở cửa</label>
                            <input type="time" value={formData.openTime} onChange={e => setFormData({...formData, openTime: e.target.value})} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Giờ đóng cửa</label>
                            <input type="time" value={formData.closeTime} onChange={e => setFormData({...formData, closeTime: e.target.value})} />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Địa chỉ nhà hàng</label>
                        <div className={styles.addressSearchBox}>
                            <input 
                                type="text" 
                                value={displayAddress}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập địa chỉ mới..."
                            />
                            {suggestions.length > 0 && (
                                <ul className={styles.suggestionList} ref={suggestionListRef}>
                                    {suggestions.map((s, index) => (
                                        <li 
                                            key={s.place_id || index} 
                                            onClick={() => selectSuggestion(s)} 
                                            className={index === activeSuggestionIndex ? styles.activeSuggestion : ''}
                                        >
                                            <strong>{s.display_place || s.display_name.split(',')[0]}</strong>
                                            <p>{s.display_name}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <button type="button" className={styles.mapTriggerBtn} onClick={() => setIsMapModalOpen(true)}>
                                📍 Không tìm thấy địa chỉ? Chọn trên bản đồ
                            </button>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose}>Hủy</button>
                        <button type="submit" disabled={isUpdating} className={styles.submitBtn}>
                            {isUpdating ? <Loader2 className={styles.spin} /> : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>

            <AnimatePresence>
                {isMapModalOpen && (
                    <motion.div 
                        className={styles.mapModalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className={styles.mapModalContent}>
                            <div className={styles.mapModalHeader}>
                                <h3>Chọn vị trí chính xác</h3>
                                <div className={styles.headerActions}>
                                    <button 
                                        type="button" 
                                        className={styles.detectLocationBtn} 
                                        onClick={handleDetectLocation}
                                    >
                                        <Navigation size={15} /> 
                                        Lấy vị trí hiện tại
                                    </button>
                                    <button className={styles.cancelButton} type="button" onClick={() => setIsMapModalOpen(false)}> <X></X></button>
                                </div>
                            </div>
                            <div className={styles.mapWrapper}>
                                <MapPicker 
                                    onLocationSelect={(lng, lat) => reverseGeocode(lng, lat)} 
                                    initialCoords={formData.address?.location?.coordinates}
                                />
                            </div>
                            <div className={styles.mapModalFooter}>
                                <p>Nhấp vào bản đồ để chọn vị trí mới</p>
                                <button 
                                    className={styles.confirmBtn} 
                                    onClick={() => setIsMapModalOpen(false)}
                                    disabled={!formData.address?.location}
                                >
                                    Xác nhận vị trí
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RestaurantEditModal;