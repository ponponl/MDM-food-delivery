import { useState, useRef, useContext } from 'react';
import axios from 'axios';
import { AddressContext } from '../context/AddressContext';

export const useAddressSearch = ({ onSelect, initialValue = '' } = {}) => {
    const { updateAddress } = useContext(AddressContext);
    const [address, setAddress] = useState(initialValue);
    const [suggestions, setSuggestions] = useState([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const typingTimeoutRef = useRef(null);

    const LIQ_KEY = import.meta.env.VITE_LOCATIONIQ_TOKEN;

    const reverseGeocode = async (lng, lat) => {
        try {
            const res = await axios.get(
                `https://us1.locationiq.com/v1/reverse?key=${LIQ_KEY}&lat=${lat}&lon=${lng}&format=json&accept-language=vi`
            );

            const details = res.data.address;
            const fullAddressData = {
                street: details.road || details.pedestrian || "",
                ward: details.suburb || details.quarter || "",
                city: details.city  || "",
                country: details.country || details.nation || "",
                full: res.data.display_name, 
                location: { 
                    type: 'Point', 
                    coordinates: [lng, lat] 
                }
            };
            const addressData = {
                fullAddress: fullAddressData.full,
                location: fullAddressData.location
            };

            // Đồng bộ tên địa chỉ lên ô input
            setAddress(fullAddressData.full.split(',')[0]);

            if (typeof onSelect === 'function') {
                onSelect(fullAddressData);
            } else {
                updateAddress(fullAddressData);
            }

            return fullAddressData;
        } catch (error) {
            console.error("Lỗi ngược địa chỉ từ tọa độ:", error);
        }
    };

    const selectSuggestion = (suggestion) => {
        const lng = parseFloat(suggestion.lon);
        const lat = parseFloat(suggestion.lat);
        
        const details = suggestion.address || {};

        const addressData = {
            street: details.road || details.pedestrian || "",
            ward: details.suburb || details.quarter || "",
            city: details.city  || "",
            country: details.country || details.nation || "",
            full: suggestion.display_name, 
            location: { 
                type: 'Point', 
                coordinates: [lng, lat] 
            }
        };

        if (typeof onSelect === 'function') {
            onSelect(addressData); 
        } else {
            updateAddress(addressData);
        }

        setAddress(addressData.full.split(',')[0]);
        setSuggestions([]);
        setActiveSuggestionIndex(-1);
    };

    const handleInputChange = (value) => {
        setAddress(value);
        setActiveSuggestionIndex(-1);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        if (value.length > 2) {
            typingTimeoutRef.current = setTimeout(async () => {
                try {
                    const res = await axios.get(
                        `https://api.locationiq.com/v1/autocomplete?key=${LIQ_KEY}&q=${value}&limit=5&dedupe=1&countrycodes=vn&accept-language=vi&addressdetails=1`
                    );
                    setSuggestions(res.data);
                } catch (err) {
                    console.error("LocationIQ Error:", err);
                }
            }, 500);
        } else {
            setSuggestions([]);
        }
    };

    const handleKeyDown = async (e) => {
        if (suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            setActiveSuggestionIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
        } else if (e.key === "ArrowUp") {
            setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : 0));
        }
        if (e.key === "Enter") {
            e.preventDefault();
            
            // Layer 1: Chọn từ gợi ý (Nếu có và đang highlight)
            if (activeSuggestionIndex >= 0 && suggestions.length > 0) {
                selectSuggestion(suggestions[activeSuggestionIndex]);
                setIsEditingAddress(false)
            } 
            // Layer 2: Không có gợi ý phù hợp -> Gọi API Search để tìm tọa độ gần đúng nhất
            else if (address.trim().length > 0) {
                try {
                    const res = await axios.get(
                        `https://us1.locationiq.com/v1/search?key=${LIQ_KEY}&q=${address}&format=json&limit=1&countrycodes=vn&accept-language=vi&addressdetails=1`
                    );
                    
                    if (res.data && res.data.length > 0) {
                        const details = res.data[0].address || {};
                        const result = {
                            street: details.road || details.pedestrian || "",
                            ward: details.suburb || details.quarter || "",
                            city: details.city  || "",
                            country: details.country || details.nation || "",
                            full: res.data[0].display_name, 
                            location: { 
                                type: 'Point', 
                                coordinates: [parseFloat(res.data[0].lon), parseFloat(res.data[0].lat)]
                            }
                        };
                        if (onSelect) onSelect(result);
                        setAddress(result.full.split(',')[0]);
                    } else {
                        console.log("Không tìm thấy địa chỉ, vui lòng sử dụng bản đồ.");
                    }
                } catch (err) {
                    console.error("Lỗi tìm kiếm thủ công:", err);
                }
                setSuggestions([]);
                setIsEditingAddress(false);
            }
        } else if (e.key === "Escape") {
            setSuggestions([]);
            setActiveSuggestionIndex(-1);
        }
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) return alert("Trình duyệt không hỗ trợ định vị.");

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const res = await axios.get(`https://us1.locationiq.com/v1/reverse?key=${LIQ_KEY}&lat=${latitude}&lon=${longitude}&format=json`);
                const details = res.data.address || {};
                const addressData = {
                    street: details.road || details.pedestrian || "",
                    ward: details.suburb || details.quarter || "",
                    city: details.city  || "",
                    country: details.country || details.nation || "",
                    full: res.data.display_name, 
                    location: { 
                        type: 'Point', 
                        coordinates: [longitude, latitude]
                    }
                };

                if (typeof onSelect === 'function') {
                    onSelect(addressData);
                } else {
                    updateAddress(addressData);
                }
                setAddress(addressData.full.split(',')[0]);
            } catch (error) {
                console.error("Lỗi vị trí.", error);
            }
        });
    };

    return {
        address, 
        setAddress, 
        suggestions,
        setSuggestions, 
        isEditingAddress,
        setIsEditingAddress,
        activeSuggestionIndex,
        handleInputChange,
        handleKeyDown,
        selectSuggestion,
        handleDetectLocation,
        reverseGeocode
    };
};