import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { trackingApi } from '../../api/trackingApi'; 
import L from 'leaflet';

const motorbikeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/9561/9561839.png',
    iconSize: [35, 35],
    iconAnchor: [17, 17],
});

const restaurantIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/948/948036.png', 
    iconSize: [35, 35],
    iconAnchor: [17, 35], // Anchor ở chân icon
});

const destinationIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/4821/4821951.png', 
    iconSize: [35, 35],
    iconAnchor: [17, 35],
});

const RecenterMap = ({ position }) => {
    const map = useMap();
    useEffect(() => {
        if (position) map.setView(position, map.getZoom());
    }, [position, map]);
    return null;
};

const TrackingMap = ({ driverId, orderId, restaurantLoc, destinationLoc, status }) => {
    const [routePoints, setRoutePoints] = useState([]);
    const [currentLoc, setCurrentLoc] = useState(null);

    const centerPosition = [10.7725, 106.7042]; 


    useEffect(() => {    
        if (!driverId || !orderId) return;

        const loadMapData = async () => {
            try {
                const response = await trackingApi.getOrderRoute(driverId, orderId);

                if (response && response.success && response.data?.route?.length > 0) {
                    const points = response.data.route.map(p => [p.lat, p.lng]);
                    setRoutePoints(points);
                    setCurrentLoc(points[0]);
                }
            } catch (error) {
                console.error("Lỗi lấy tọa độ từ Cassandra:", error);
            }
        };

        loadMapData();

        let interval;
        if (status === 'delivering') {
            interval = setInterval(loadMapData, 3000);
        }

        return () => clearInterval(interval);
    }, [driverId, orderId, status]); 

    return (
        <div style={{ height: '60vh', width: '100%', borderRadius: '15px', overflow: 'hidden' }}>
            <MapContainer center={restaurantLoc || [10.7725, 106.7042]} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                <RecenterMap position={currentLoc} />

                {restaurantLoc && (
                    <Marker position={restaurantLoc} icon={restaurantIcon}>
                        <Popup><b>Cửa hàng</b></Popup>
                    </Marker>
                )}

                {destinationLoc && (
                    <Marker position={destinationLoc} icon={destinationIcon}>
                        <Popup><b>Giao đến</b></Popup>
                    </Marker>
                )}

                {routePoints.length > 1 && (
                    <Polyline positions={routePoints} color="#3498db" weight={4} />
                )}
                
                {currentLoc && (
                    <Marker position={currentLoc} icon={motorbikeIcon}>
                        <Popup>Tài xế đang ở đây!</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default TrackingMap;