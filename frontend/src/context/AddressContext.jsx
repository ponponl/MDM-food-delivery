import { Children, createContext, useState, useEffect } from 'react';

export const AddressContext = createContext();

export function AddressProvider({children}) {
    const [address, setAddress] = useState(() => {
        const saveAddress = localStorage.getItem('userAddress');
        return saveAddress ? JSON.parse(saveAddress) : null;
    });

    useEffect(() => {
        if (address) {
            localStorage.setItem('userAddress', JSON.stringify(address));
        }
    }, [address]);

    const updateAddress = (newAddress) => {
        setAddress(newAddress);
    };

    return (
        <>
            <AddressContext.Provider value={{address, updateAddress}}>
                {children}
            </AddressContext.Provider>
        </>
    );
}