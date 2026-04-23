import React, { useState, useEffect } from 'react'; 
import { Trash2, MapPin, Building2, Hash, Map as MapIcon, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { useAddressSearch } from '../../hooks/useAddressSearch.js';
import MapPicker from '../../components/mapPicker/MapPicker'; 
import styles from './AddressItem.module.css';

const AddressItem = ({ addr, index, onChange, onRemove }) => {
    const [isMapOpen, setIsMapOpen] = useState(false);
    const {
        address: searchInput,
        setAddress,
        suggestions,
        handleInputChange,
        handleKeyDown,
        selectSuggestion,
        activeSuggestionIndex,
        reverseGeocode,
        handleDetectLocation
    } = useAddressSearch({
        initialValue: addr.full || "",
        onSelect: (data) => {
            onChange(index, { 
                ...addr, 
                full: data.full, 
                location: data.location 
            });
        }
    });

    useEffect(() => {
        setAddress(addr.full || "");
    }, [addr.full, setAddress]);

    const handleConfirmMap = () => {
        setIsMapOpen(false);
    };

    return (
        <div className={styles.addressCard}>
            <div className={styles.cardHeader}>
                <span className={styles.addressNumber}>Địa chỉ {index + 1}</span>
                <button 
                    type="button" 
                    className={styles.deleteBtn} 
                    onClick={() => onRemove(index)}
                    title="Xóa địa chỉ này"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className={styles.inputGrid}>
                {/* 2 Ô nhập thông tin bổ sung (Optional) */}
                <div className={styles.inputWrapper}>
                    <Building2 size={16} className={styles.inputIcon} />
                    <input
                        type="text"
                        placeholder="Tòa nhà / Dấu mốc (ví dụ: Landmark 81)"
                        value={addr.building || ""}
                        onChange={(e) => onChange(index, { ...addr, building: e.target.value })}
                    />
                </div>
                <div className={styles.inputWrapper}>
                    <Hash size={16} className={styles.inputIcon} />
                    <input
                        type="text"
                        placeholder="Tầng / Căn hộ (ví dụ: Tầng 10, P.1002)"
                        value={addr.note || ""}
                        onChange={(e) => onChange(index, { ...addr, note: e.target.value })}
                    />
                </div>
            </div>

            {/* Ô tìm kiếm địa chỉ chi tiết (Bắt buộc để lấy tọa độ) */}
            <div className={styles.searchWrapper}>
                <div className={styles.inputWrapper}>
                    <MapPin size={16} className={styles.inputIcon} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm địa chỉ chi tiết..."
                        value={searchInput}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={styles.searchInput}
                    />
                    <button 
                        type="button" 
                        className={styles.mapTriggerBtn}
                        onClick={() => setIsMapOpen(true)}
                        title="Chọn trên bản đồ"
                    >
                        <MapIcon size={18} />
                    </button>
                </div>
                {suggestions.length > 0 && (
                    <ul className={styles.suggestionList}>
                        {suggestions.map((s, idx) => (
                            <li 
                                key={idx} 
                                onClick={() => selectSuggestion(s)}
                                className={idx === activeSuggestionIndex ? styles.activeSuggest : ''}
                            >
                                <MapPin size={14} />
                                <span>{s.display_name}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <AnimatePresence>
                {isMapOpen && (
                    <motion.div 
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className={styles.modalContent}>
                            <div className={styles.modalHeader}>
                                <h3>Vị trí địa chỉ {index + 1}</h3>
                                {/* THÊM NÚT ĐỊNH VỊ GPS VÀO ĐÂY */}
                                <div className={styles.headerActions}>
                                    <button 
                                        type="button" 
                                        className={styles.detectLocationBtn}
                                        onClick={handleDetectLocation}
                                    >
                                        <Navigation size={14} /> Dùng vị trí hiện tại
                                    </button>
                                    <button onClick={() => setIsMapOpen(false)}>✕</button>
                                </div>
                            </div>
                            <div className={styles.mapWrapper}>
                                <MapPicker 
                                    onLocationSelect={(lng, lat) => reverseGeocode(lng, lat)} 
                                    initialCoords={addr.location?.coordinates}
                                />
                            </div>
                            <div className={styles.modalFooter}>
                                <button className={styles.confirmBtn} onClick={handleConfirmMap}>
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

export default AddressItem;