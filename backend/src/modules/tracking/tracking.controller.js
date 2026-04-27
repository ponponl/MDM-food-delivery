import { fetchTrackingHistory } from './tracking.service.js';

export const getOrderTracking = async (req, res) => {
    try {
        const order_id = req.params.order_id || req.query.order_id; 

        if (!order_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Thiếu mã đơn hàng (order_id)' 
            });
        }

        const trackingData = await fetchTrackingHistory(order_id);

        return res.status(200).json({
            success: true,
            data: trackingData
        });

    } catch (error) {
        console.error('Lỗi tại Tracking Controller:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi lấy lịch sử tracking' 
        });
    }
};