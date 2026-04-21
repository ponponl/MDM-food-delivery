import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import L from 'leaflet';

// Fix lỗi không hiển thị icon marker của Leaflet trong React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

function MapUpdater({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords && coords.length === 2) {
            const [lng, lat] = coords;
            // flyTo: di chuyển mượt đến tọa độ [lat, lng] với độ zoom 17
            map.flyTo([lat, lng], 17, {
                duration: 2, // Thời gian di chuyển (giây)
                easeLinearity: 0.25
            });
        }
    }, [coords, map]);
    return null;
}

export default function MapPicker({ onLocationSelect, initialCoords }) {
  const defaultPos = [10.762622, 106.660172];
  const currentPos = initialCoords ? [initialCoords[1], initialCoords[0]] : defaultPos;
  const [position, setPosition] = useState(currentPos);
  useEffect(() => {
    if (initialCoords) {
      setPosition([initialCoords[1], initialCoords[0]]);
    }
  }, [initialCoords]);
  // Component xử lý sự kiện click lên bản đồ
  function LocationMarker() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        // Gửi tọa độ về cho Hook xử lý
        onLocationSelect(lng, lat); 
      },
    });

    return position === null ? null : (
      <Marker position={position}></Marker>
    );
  }

  return (
    <MapContainer 
      center={position} 
      zoom={15} 
      style={{ height: '300px', width: '100%', borderRadius: '8px', marginTop: '10px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapUpdater coords={initialCoords} />
      <LocationMarker />
    </MapContainer>
  );
}