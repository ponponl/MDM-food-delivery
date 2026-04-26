export const formatTrackingData = (row) => {
    return {
        lat: row.lat,
        lng: row.lng,
        timestamp: row.timestamp,
        orderId: row.order_id
    };
};