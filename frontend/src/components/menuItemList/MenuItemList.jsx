import { useNavigate} from 'react-router-dom';
import { useState } from 'react';
import MenuCard from '../display/MenuCard';
import styles from './MenuItemList.module.css';
import OptionSelectionModal from '../optionSelectionModal/OptionSelectionModal';

const MenuItemsList = ({ groupedMenu, onAddToCart }) => {
    const navigate = useNavigate();

    const handleItemClick = (item) => {
        navigate(`/food/${item.itemId}`, { state: { foodItem: item } });
    };

    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenCustomization = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleConfirmCustomization = (finalItem) => {
        onAddToCart?.(finalItem);
        setIsModalOpen(false);
    };

    return (
        <div className={styles.menuItemsList}>
            {Object.entries(groupedMenu).map(([category, items]) => (
                (() => {
                    const sortedItems = [...items].sort((a, b) => {
                        const aUnavailable = a?.available === false || a?.stock === 0;
                        const bUnavailable = b?.available === false || b?.stock === 0;
                        if (aUnavailable === bUnavailable) return 0;
                        return aUnavailable ? 1 : -1;
                    });

                    return (
                        <div key={category} id={category} className={styles.categorySection}>
                            <h2 className={styles.categoryTitle}>{category}</h2>
                            <div className={styles.foodGrid}>
                                {sortedItems.map((item) => {
                                    const isUnavailable = item?.available === false || item?.stock === 0;
                                    let statusLabel = '';
                                    if (item?.available === false) {
                                        statusLabel = 'Tạm dừng bán'; 
                                    } else if (item?.stock <= 0) {
                                        statusLabel = 'Hết món'; 
                                    }

                                    return (
                                        <div
                                            key={item.itemId}
                                            onClick={() => handleItemClick(item)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <MenuCard
                                                item={item}
                                                isUnavailable={isUnavailable}
                                                statusLabel={statusLabel}
                                                onAddToCart={onAddToCart}
                                                onOpenCustomization={handleOpenCustomization}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()
            ))}
            <OptionSelectionModal 
                isOpen={isModalOpen}
                item={selectedItem}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmCustomization}
            />
        </div>
    );
};

export default MenuItemsList;