import MenuCard from '../display/MenuCard';
import styles from './MenuItemList.module.css';

const MenuItemsList = ({ groupedMenu, onAddToCart }) => {
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
                                    const statusLabel = item?.available === false ? 'Tạm ngưng phục vụ' : 'Hết món';

                                    return (
                                        <MenuCard
                                            key={item._id}
                                            item={item}
                                            isUnavailable={isUnavailable}
                                            statusLabel={statusLabel}
                                            onAddToCart={onAddToCart}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()
            ))}
        </div>
    );
};

export default MenuItemsList;