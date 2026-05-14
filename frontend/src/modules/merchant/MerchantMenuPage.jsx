import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Box, Tag, UtensilsCrossed, CookingPot, Loader2, Settings2, LayoutGrid, Eye } from 'lucide-react';
import AddDishCard from '../../components/addDishCard/AddDishCard.jsx';
import AddCustomizationGroup from '../../components/addCustomizationGroup/AddCustomizationGroup.jsx';
import { useAuth } from '../../context/AuthContext'; 
import menuApi from '../../api/menuApi';
import styles from './MerchantMenuPage.module.css';
import toast from 'react-hot-toast';

const mockCustomGroups = [
    {
        _id: "cg1",
        groupName: "Topping Burger",
        isRequired: false,
        options: [
            { label: "Thêm Phô mai lát", extraPrice: 10000, available: true },
            { label: "Thêm Thịt xông khói", extraPrice: 15000, available: true },
            { label: "Thêm Trứng ốp la", extraPrice: 5000, available: false } // Hết hàng
        ]
    },
    {
        _id: "cg2",
        groupName: "Size Pizza",
        isRequired: true, // Bắt buộc chọn
        options: [
            { label: "Size M (9 inch)", extraPrice: 0, available: true },
            { label: "Size L (12 inch)", extraPrice: 50000, available: true }
        ]
    },
    {
        _id: "cg3",
        groupName: "Mức Đường & Đá",
        isRequired: true,
        options: [
            { label: "100% Đường - 100% Đá", extraPrice: 0, available: true },
            { label: "50% Đường - Ít Đá", extraPrice: 0, available: true },
            { label: "Không Đường - Không Đá", extraPrice: 0, available: true }
        ]
    },
    {
        _id: "cg4",
        groupName: "Mức Đường & Đá",
        isRequired: true,
        options: [
            { label: "100% Đường - 100% Đá", extraPrice: 0, available: true },
            { label: "50% Đường - Ít Đá", extraPrice: 0, available: true },
            { label: "Không Đường - Không Đá", extraPrice: 0, available: true }
        ]
    },
    {
        _id: "cg5",
        groupName: "Mức Đường & Đá",
        isRequired: true,
        options: [
            { label: "100% Đường - 100% Đá", extraPrice: 0, available: true },
            { label: "50% Đường - Ít Đá", extraPrice: 0, available: true },
            { label: "Không Đường - Không Đá", extraPrice: 0, available: true }
        ]
    },
    {
        _id: "cg6",
        groupName: "Mức Đường & Đá",
        isRequired: true,
        options: [
            { label: "100% Đường - 100% Đá", extraPrice: 0, available: true },
            { label: "50% Đường - Ít Đá", extraPrice: 0, available: true },
            { label: "Không Đường - Không Đá", extraPrice: 0, available: true }
        ]
    }
];

const MerchantMenu = () => {
    const [activeTab, setActiveTab] = useState('menu');
    const { user, loading: authLoading } = useAuth(); 
    const publicId = user?.restaurantInfo.publicId || '';
    const [menu, setMenu] = useState([]);
    const [customGroups, setCustomGroups] = useState(mockCustomGroups);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);

    // if (authLoading || isInitialLoading) {
    //     return (
    //         <div className={styles.loadingContainer}>
    //             <Loader2 className={styles.spinner} />
    //             <p>Đang tải dữ liệu...</p>
    //         </div>
    //     );
    // }

    const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

    const fetchCustomGroups = async () => {
        try {
            // Giả sử API: menuApi.getCustomizationGroups(publicId)
            //const response = await menuApi.getCustomizationGroups(publicId);
            setCustomGroups(response || []);
        } catch (err) {
            console.error("Lỗi khi tải nhóm tùy chỉnh:", err);
        }
    };

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
        fetchCustomGroups();
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

    const handleAddGroup = () => {
        setEditingGroup(null);
        setIsGroupModalOpen(true);
    };


    const handleEditGroup = (group) => {
        setEditingGroup(group); // Truyền dữ liệu nhóm vào state
        setIsGroupModalOpen(true);
    };

    const handleAddDish = () => {
        setEditingItem(null); 
        setIsModalOpen(true);
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

    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm("Xóa nhóm này sẽ ảnh hưởng đến các món đang liên kết. Tiếp tục?")) return;
        // Thực hiện xóa qua API...
    };

    const handleGroupSubmit = async (formData) => {
        try {
            setIsActionLoading(true); // Bắt đầu xoay icon loading (truyền vào prop isUploading)
            
            if (editingGroup) {
                //await customizationApi.update(editingGroup._id, formData);
                toast.success("Cập nhật thành công!");
            } else {
                //await customizationApi.create(formData);
                toast.success("Tạo nhóm mới thành công!");
            }
            
            setIsGroupModalOpen(false); // Đóng modal
            fetchCustomGroups(); // Reload dữ liệu cho Tab Nhóm tùy chỉnh
        } catch (err) {
            toast.error("Lỗi hệ thống, vui lòng thử lại");
        } finally {
            setIsActionLoading(false); // Dừng xoay icon
        }
    };

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
                    <button className={styles.addBtn} onClick={() => {activeTab === 'menu' ? handleAddDish(): handleAddGroup()}}>
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
                                                        <div className={styles.stockInfo}>Kho: {item.remainingQuantity !== undefined ? item.remainingQuantity : item.stock}</div>
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
                                    onClick={() => handleAddDish()}
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
                                                    <button className={styles.actionBtn} onClick={() => handleEditGroup(group)}><Eye size={16} /></button>
                                                    <button className={styles.actionBtn} onClick={() => handleEditGroup(group)}><Edit3 size={16} /></button>
                                                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDeleteGroup(group._id)}>
                                                        <Trash2 size={16} />
                                                    </button>
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
                                    onClick={() => handleAddGroup()}
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

            <AddCustomizationGroup 
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                onSubmit={handleGroupSubmit}
                editingGroup={editingGroup}
                isUploading={isActionLoading}
            />
        </div>
    );
};

export default MerchantMenu;