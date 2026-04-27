export const formatTrackingData = (row) => {
    return {
        lat: row.lat,
        lng: row.lng,
        timestamp: row.timestamp,
        driverId: row.driver_id 
    };
};