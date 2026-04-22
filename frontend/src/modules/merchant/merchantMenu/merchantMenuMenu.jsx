import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Box, Tag, MoreVertical, AlertCircle } from 'lucide-react';
import styles from './MerchantMenu.module.css';

const MerchantMenu = () => {
    // Giữ nguyên logic dữ liệu của bạn
    const [menu, setMenu] = useState([
        {
            _id: '67d4f1010000000000000031',
            name: "Cơm Chiên Bò Lúc Lắc",
            price: 55000,
            category: "Cơm",
            available: true,
            stock: 300,
            description: "Cơm chiên với bò lúc lắc truyền thống",
            images: ["https://down-cvs-vn.img.susercontent.com/vn-11134517-7ras8-m0hnvcmb3i7..."]
        },
        // Thêm data mẫu để test Grid
        { _id: '2', name: "Cơm Gà Hải Nam", price: 45000, category: "Cơm", available: true, stock: 50, description: "Gà ta luộc thơm ngon", images: ["https://images.unsplash.com/photo-1567033984534-da488820464c?q=80&w=1974&auto=format&fit=crop"] },
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

    const groupedMenu = menu.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    return (
        <div className={styles.menuTabContainer}>
            <header className={styles.tabHeader}>
                <div className={styles.headerTitle}>
                    <h2>Thực đơn cửa hàng</h2>
                    <span>Bạn có {menu.length} món ăn trong danh sách</span>
                </div>
                <button className={styles.addBtn} onClick={() => {setEditingItem(null); setIsModalOpen(true);}}>
                    <Plus size={18} />
                    Thêm món mới
                </button>
            </header>

            <div className={styles.menuContent}>
                {Object.entries(groupedMenu).map(([category, items]) => (
                    <section key={category} className={styles.categoryGroup}>
                        <div className={styles.categoryHeader}>
                            <Tag size={16} className={styles.catIcon} />
                            <h3>{category}</h3>
                            <span className={styles.itemCount}>{items.length} món</span>
                        </div>
                        
                        <div className={styles.compactGrid}>
                            {items.map((item) => (
                                <div key={item._id} className={styles.compactCard}>
                                    <div className={styles.imageSection}>
                                        <img src={item.images[0]} alt={item.name} />
                                        <div className={`${styles.badgeMini} ${item.available ? styles.bgIn : styles.bgOut}`}>
                                            {item.available ? 'Bán' : 'Ngưng'}
                                        </div>
                                    </div>
                                    
                                    <div className={styles.infoSection}>
                                        <div className={styles.mainInfo}>
                                            <h4>{item.name}</h4>
                                            <span className={styles.price}>{formatCurrency(item.price)}</span>
                                        </div>
                                        
                                        <div className={styles.metaInfo}>
                                            <div className={styles.stockInfo}>
                                                <Box size={12} />
                                                <span>Kho: {item.stock}</span>
                                            </div>
                                        </div>

                                        <div className={styles.actionsOverlay}>
                                            <button className={styles.actionIconBtn} title="Sửa" onClick={() => {setEditingItem(item); setIsModalOpen(true);}}>
                                                <Edit3 size={14} />
                                            </button>
                                            <button className={`${styles.actionIconBtn} ${styles.deleteBtn}`} title="Xóa">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {/* Modal giữ nguyên logic cũ nhưng style gọn hơn */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalBody}>
                        <h3>{editingItem ? 'Cập nhật món ăn' : 'Tạo món mới'}</h3>
                        <form className={styles.menuForm}>
                            <div className={styles.formGroup}>
                                <label>Tên món ăn</label>
                                <input type="text" defaultValue={editingItem?.name} placeholder="Nhập tên món..." />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Giá bán (VNĐ)</label>
                                    <input type="number" defaultValue={editingItem?.price} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Số lượng kho</label>
                                    <input type="number" defaultValue={editingItem?.stock} />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Mô tả ngắn</label>
                                <textarea defaultValue={editingItem?.description} placeholder="Mô tả món ăn cho khách hàng..." />
                            </div>
                            <div className={styles.modalButtons}>
                                <button type="button" className={styles.btnCancel} onClick={() => setIsModalOpen(false)}>Đóng</button>
                                <button type="button" className={styles.btnSave}>Xác nhận</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MerchantMenu;