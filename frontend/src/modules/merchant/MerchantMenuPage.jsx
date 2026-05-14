import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Box, Tag, UtensilsCrossed, CookingPot, Loader2, Settings2, LayoutGrid } from 'lucide-react';
import AddDishCard from '../../components/addDishCard/AddDishCard.jsx';
import { useAuth } from '../../context/AuthContext'; 
import menuApi from '../../api/menuApi';
import styles from './MerchantMenuPage.module.css';
import toast from 'react-hot-toast';

const MerchantMenu = () => {
    // const [menu, setMenu] = useState([
    //     {
    //         _id: '67d4f1010000000000000031',
    //         name: "Cơm Chiên Bò Lúc Lắc",
    //         price: 55000,
    //         category: "Cơm",
    //         available: true,
    //         stock: 300,
    //         description: "Cơm chiên với bò lúc lắc truyền thống",
    //         images: ["https://down-cvs-vn.img.susercontent.com/vn-11134517-7ras8-m0hnvcmb3i7..."]
    //     },
    //     { _id: '2', name: "Cơm Gà Hải Nam", price: 45000, category: "Cơm", available: true, stock: 50, description: "Gà ta luộc thơm ngon", images: ["https://images.unsplash.com/photo-1567033984534-da488820464c?q=80&w=1974&auto=format&fit=crop"] },
    // ]);
    const [activeTab, setActiveTab] = useState('menu');
    const { user, loading: authLoading } = useAuth(); 
    const publicId = user?.restaurantInfo.publicId || '';
    const [menu, setMenu] = useState([]);
    const [customGroups, setCustomGroups] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // if (authLoading || isInitialLoading) {
    //     return (
    //         <div className={styles.loadingContainer}>
    //             <Loader2 className={styles.spinner} />
    //             <p>Đang tải dữ liệu...</p>
    //         </div>
    //     );
    // }

    const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

    const fetchMenu = async () => {
        if (!publicId) return;
        try {
            setIsInitialLoading(true);
            const response = await menuApi.getMenuByRestaurant(publicId);
            setMenu(response || []);
        } catch (err) {
            console.error("Lỗi khi tải menu:", err);
            toast.error("Không thể tải danh sách món ăn");
        } finally {
            setIsInitialLoading(false);
        }
    };

    useEffect(() => {
        fetchMenu();
    }, [publicId]);

    const groupedMenu = menu.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    const handleDishSubmit = async (formData) => {
        try {
            setIsActionLoading(true);
            formData.append('publicId', publicId);
            if (editingItem) {
                await menuApi.updateDish(editingItem.itemId, formData);
                toast.success("Cập nhật món ăn thành công");
            } else {
                await menuApi.addDish(formData);
                toast.success("Thêm món ăn thành công");
            }
            setIsModalOpen(false);
            fetchMenu();
        } catch (err) {
            toast.error(err.response?.data?.message || "Đã có lỗi xảy ra");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDelete = async (itemId, publicId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa món này?")) return;
        try {
            await menuApi.deleteDish(itemId, publicId);
            setMenu(prevMenu => prevMenu.filter(item => item.itemId !== itemId));
            toast.success("Xóa món thành công");
        } catch (err) {
            toast.error("Không thể xóa món ăn");
        }
    };

    // const renderSkeletons = () => (
    //     <div className={styles.menuContent}>
    //         <div className={styles.categoryHeader}>
    //             <div className={`${styles.skeleton} ${styles.skeletonDishName}`} style={{ width: '150px', height: '24px' }}></div>
    //         </div>
    //         <div className={styles.compactGrid}>
    //             {[1, 2, 3, 4, 5, 6].map((i) => (
    //                 <div key={i} className={styles.compactCard}>
    //                     <div className={`${styles.skeleton} ${styles.skeletonImage}`}></div>
    //                     <div className={styles.skeletonInfo}>
    //                         <div className={styles.skeletonTitleRow}>
    //                             <div className={`${styles.skeleton} ${styles.skeletonDishName}`}></div>
    //                             <div className={`${styles.skeleton} ${styles.skeletonPrice}`}></div>
    //                         </div>
    //                         <div className={`${styles.skeleton} ${styles.skeletonDescription}`}></div>
    //                         <div className={styles.skeletonMeta}>
    //                             <div className={`${styles.skeleton} ${styles.skeletonStock}`}></div>
    //                             <div className={styles.skeletonActions}>
    //                                 <div className={`${styles.skeleton} ${styles.skeletonActionBtn}`}></div>
    //                                 <div className={`${styles.skeleton} ${styles.skeletonActionBtn}`}></div>
    //                             </div>
    //                         </div>
    //                     </div>
    //                 </div>
    //             ))}
    //         </div>
    //     </div>
    // );

    const renderSkeletons = () => (
        <div className={styles.compactGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={`${styles.compactCard} ${styles.skeletonCard}`}>
                    {/* Chỉ hiện skeleton ảnh cho tab menu */}
                    {activeTab === 'menu' && <div className={`${styles.skeleton} ${styles.skeletonImage}`}></div>}
                    
                    <div className={styles.infoSection}>
                        <div className={styles.skeletonTitleRow}>
                            <div className={`${styles.skeleton} ${styles.skeletonDishName}`} style={{ width: '60%' }}></div>
                            <div className={`${styles.skeleton} ${styles.skeletonPrice}`} style={{ width: '20%' }}></div>
                        </div>
                        <div className={`${styles.skeleton} ${styles.skeletonDescription}`} style={{ width: '90%', marginTop: '12px' }}></div>
                        <div className={`${styles.skeleton} ${styles.skeletonDescription}`} style={{ width: '70%', marginTop: '8px' }}></div>
                        
                        <div className={styles.skeletonMeta} style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                            <div className={`${styles.skeleton} ${styles.skeletonStock}`} style={{ width: '100px', height: '16px' }}></div>
                            <div className={styles.skeletonActions} style={{ display: 'flex', gap: '8px' }}>
                                <div className={`${styles.skeleton} ${styles.skeletonActionBtn}`} style={{ width: '32px', height: '32px', borderRadius: '8px' }}></div>
                                <div className={`${styles.skeleton} ${styles.skeletonActionBtn}`} style={{ width: '32px', height: '32px', borderRadius: '8px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // return (
    //     <div className={styles.container}>
    //         <div className={styles.wrapper}>
    //             <div className={styles.header}>
    //                 <div className={styles.headerInfo}>
    //                     <h1 className={styles.title}>Quản Lý Thực Đơn</h1>
    //                     {isInitialLoading ? (
    //                         <div className={`${styles.skeleton}`} style={{ width: '200px', height: '16px', marginTop: '8px' }}></div>
    //                     ) : (
    //                         <p className={styles.subtitle}>
    //                             {menu.length > 0 
    //                                 ? `Menu đang có ${menu.length} món ăn có sẵn` 
    //                                 : 'Bắt đầu xây dựng thực đơn cho cửa hàng của bạn'}
    //                         </p>
    //                     )}
    //                 </div>
    //                 <button className={styles.addBtn} onClick={() => {setEditingItem(null); setIsModalOpen(true);}}>
    //                     <Plus size={20} />
    //                     Thêm món mới
    //                 </button>
    //             </div>

    //             {isInitialLoading ? (
    //                 renderSkeletons()
    //             ) : menu.length === 0 ? (
    //                 <div className={styles.emptyStateContainer}>
    //                     <div className={styles.emptyIconWrapper}>
    //                         <CookingPot size={80} strokeWidth={1.5} />
    //                     </div>
    //                     <h2 className={styles.emptyTitle}>Cửa hàng chưa có món ăn nào</h2>
    //                     <p className={styles.emptyDescription}>
    //                         Hãy thêm những món ăn hấp dẫn đầu tiên để bắt đầu bán hàng nhé ^^!
    //                     </p>
    //                     <button 
    //                         className={styles.addFirstBtn} 
    //                         onClick={() => {setEditingItem(null); setIsModalOpen(true);}}
    //                     >
    //                         <Plus size={20} /> Thêm món ăn đầu tiên
    //                     </button>
    //                 </div>
    //             ) : (
    //                 <div className={styles.menuContent}>
    //                     {Object.entries(groupedMenu).map(([category, items]) => (
    //                         <section key={category} className={styles.categorySection}>
    //                             <div className={styles.categoryHeader}>
    //                                 <div className={styles.categoryTitleWrapper}>
    //                                     <UtensilsCrossed size={18} className={styles.catIcon} />
    //                                     <h2 className={styles.categoryTitle}>{category}</h2>
    //                                 </div>
    //                                 <span className={styles.itemCountBadge}>{items.length} món</span>
    //                             </div>
                                
    //                             <div className={styles.compactGrid}>
    //                                 {items.map((item) => (
    //                                     <div key={item.itemId} className={styles.compactCard}>
    //                                         <div className={styles.imageSection}>
    //                                             <img src={item.images[0]} alt={item.name} />
    //                                             <div className={`${styles.statusBadge} ${item.available ? styles.bgIn : styles.bgOut}`}>
    //                                                 {item.available ? 'Đang bán' : 'Tạm dừng'}
    //                                             </div>
    //                                         </div>
                                            
    //                                         <div className={styles.infoSection}>
    //                                             <div className={styles.mainInfo}>
    //                                                 <h4 className={styles.dishName}>{item.name}</h4>
    //                                                 <span className={styles.priceText}>{formatCurrency(item.price)}</span>
    //                                             </div>

    //                                             <p className={styles.descriptionText}>{item.description}</p>
                                                
    //                                             <div className={styles.metaRow}>
    //                                                 <div className={styles.stockInfo}>
    //                                                     <span>Số lượng có sẵn: {item.stock}</span>
    //                                                 </div>
    //                                                 <div className={styles.cardActions}>
    //                                                     <button className={styles.actionBtn} onClick={() => {setEditingItem(item); setIsModalOpen(true);}}>
    //                                                         <Edit3 size={16} />
    //                                                     </button>
    //                                                     <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(item.itemId, publicId)}>
    //                                                         <Trash2 size={16} />
    //                                                     </button>
    //                                                 </div>
    //                                             </div>
    //                                         </div>
    //                                     </div>
    //                                 ))}
    //                             </div>
    //                         </section>
    //                     ))}
    //                 </div>
    //             )}
    //         </div>
    //         <AddDishCard 
    //             isOpen={isModalOpen}
    //             onClose={() => setIsModalOpen(false)}
    //             onSubmit={handleDishSubmit}
    //             editingItem={editingItem}
    //             isUploading={isActionLoading}
    //         />
    //     </div>
    // );
    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                {/* HEADER & TABS */}
                <div className={styles.header}>
                    <div className={styles.headerInfo}>
                        <h1 className={styles.title}>Quản Lý Cửa Hàng</h1>
                        {isInitialLoading ? (
                            <div className={styles.skeleton} style={{ width: '200px', height: '16px', marginTop: '8px' }}></div>
                        ) : (
                            <p className={styles.subtitle}>
                                {activeTab === 'menu' 
                                    ? (menu.length > 0 ? `Menu đang có ${menu.length} món ăn có sẵn` : 'Bắt đầu xây dựng thực đơn cho cửa hàng của bạn')
                                    : (customGroups.length > 0 ? `Đang có ${customGroups.length} nhóm tùy chỉnh` : 'Thiết lập các tùy chọn cho món ăn của bạn')}
                            </p>
                        )}
                        <div className={styles.tabContainer}>
                            <button 
                                className={`${styles.tabBtn} ${activeTab === 'menu' ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab('menu')}
                            >
                                <LayoutGrid size={18} /> Thực đơn
                            </button>
                            <button 
                                className={`${styles.tabBtn} ${activeTab === 'custom' ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab('custom')}
                            >
                                <Settings2 size={18} /> Tùy chỉnh
                            </button>
                        </div>
                    </div>
                    <button className={styles.addBtn} onClick={() => {setEditingItem(null); setIsModalOpen(true);}}>
                        <Plus size={20} /> {activeTab === 'menu' ? 'Thêm món mới' : 'Thêm nhóm mới'}
                    </button>
                </div>

                {/* CONTENT AREA */}
                <div className={styles.mainContent}>
                    {isInitialLoading ? (
                        /* SKELETON LOADING VIEW */
                        <div className={styles.compactGrid}>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className={`${styles.compactCard} ${styles.skeletonCard}`}>
                                    {activeTab === 'menu' && <div className={styles.skeletonImage}></div>}
                                    <div className={styles.skeletonInfo}>
                                        <div className={styles.skeletonTitleRow}>
                                            <div className={`${styles.skeleton} ${styles.skeletonDishName}`}></div>
                                            <div className={`${styles.skeleton} ${styles.skeletonPrice}`}></div>
                                        </div>
                                        <div className={`${styles.skeleton} ${styles.skeletonDescription}`}></div>
                                        <div className={styles.skeletonMeta}>
                                            <div className={`${styles.skeleton} ${styles.skeletonStock}`}></div>
                                            <div className={styles.skeletonActions}>
                                                <div className={`${styles.skeleton} ${styles.skeletonActionBtn}`}></div>
                                                <div className={`${styles.skeleton} ${styles.skeletonActionBtn}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'menu' ? (
                        /* VIEW THỰC ĐƠN */
                        Object.entries(groupedMenu).length > 0 ? (
                            Object.entries(groupedMenu).map(([category, items]) => (
                                <section key={category} className={styles.categorySection}>
                                    <div className={styles.categoryHeader}>
                                        <div className={styles.categoryTitleWrapper}>
                                            <UtensilsCrossed size={18} className={styles.catIcon} />
                                            <h2 className={styles.categoryTitle}>{category}</h2>
                                        </div>
                                        <span className={styles.itemCountBadge}>{items.length} món</span>
                                    </div>
                                    <div className={styles.compactGrid}>
                                        {items.map((item) => (
                                            <div key={item.itemId} className={styles.compactCard}>
                                                <div className={styles.imageSection}>
                                                    <img src={item.images?.[0] || '/placeholder.png'} alt={item.name} />
                                                    <div className={`${styles.statusBadge} ${item.available ? styles.bgIn : styles.bgOut}`}>
                                                        {item.available ? 'Đang bán' : 'Tạm dừng'}
                                                    </div>
                                                </div>
                                                <div className={styles.infoSection}>
                                                    <div className={styles.mainInfo}>
                                                        <h4 className={styles.dishName}>{item.name}</h4>
                                                        <span className={styles.priceText}>{formatCurrency(item.price)}</span>
                                                    </div>
                                                    <p className={styles.descriptionText}>{item.description}</p>
                                                    <div className={styles.metaRow}>
                                                        <div className={styles.stockInfo}>Kho: {item.stock}</div>
                                                        <div className={styles.cardActions}>
                                                            <button className={styles.actionBtn} onClick={() => {setEditingItem(item); setIsModalOpen(true);}}>
                                                                <Edit3 size={16} />
                                                            </button>
                                                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(item.itemId, publicId)}>
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))
                        ) : (
                            /* EMPTY STATE MENU */
                            <div className={styles.emptyStateContainer}>
                                <div className={styles.emptyIconWrapper}>
                                    <CookingPot size={80} strokeWidth={1.5} />
                                </div>
                                <h2 className={styles.emptyTitle}>Cửa hàng chưa có món ăn nào</h2>
                                <p className={styles.emptyDescription}>
                                    Hãy thêm những món ăn hấp dẫn đầu tiên để bắt đầu bán hàng nhé ^^!
                                </p>
                                <button 
                                    className={styles.addFirstBtn} 
                                    onClick={() => {setEditingItem(null); setIsModalOpen(true);}}
                                >
                                    <Plus size={20} /> Thêm món ăn đầu tiên
                                </button>
                            </div>
                        )
                    ) : (
                        /* VIEW QUẢN LÝ CUSTOMIZATION */
                        customGroups.length > 0 ? (
                            <div className={styles.compactGrid}>
                                {customGroups.map((group) => (
                                    <div key={group._id} className={styles.compactCard}>
                                        <div className={styles.infoSection}>
                                            <div className={styles.mainInfo}>
                                                <h4 className={styles.dishName}>{group.groupName}</h4>
                                                <span className={styles.itemCountBadge}>{group.options.length} lựa chọn</span>
                                            </div>
                                            <p className={styles.descriptionText}>
                                                {group.options.map(opt => opt.label).join(', ')}
                                            </p>
                                            <div className={styles.metaRow}>
                                                <span className={styles.stockInfo}>{group.isRequired ? 'Bắt buộc' : 'Tùy chọn'}</span>
                                                <div className={styles.cardActions}>
                                                    <button className={styles.actionBtn}><Edit3 size={16} /></button>
                                                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`}><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyStateContainer}>
                                <div className={styles.emptyIconWrapper}>
                                    <Settings2 size={80} strokeWidth={1.5} />
                                </div>
                                <h2 className={styles.emptyTitle}>Cửa hàng chưa thêm lựa chọn tùy chỉnh</h2>
                                <p className={styles.emptyDescription}>
                                    Hãy cung cấp thêm nhiều sự lựa chọn cho khách hàng nhé^^!
                                </p>
                                <button 
                                    className={styles.addFirstBtn} 
                                    onClick={() => {setEditingItem(null); setIsModalOpen(true);}}
                                >
                                    <Plus size={20} /> Thêm tùy chỉnh
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>

            <AddDishCard 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleDishSubmit}
                editingItem={editingItem}
                isUploading={isActionLoading}
                availableGroups={customGroups}
            />
        </div>
    );
};

export default MerchantMenu;