import { fetchTrackingHistory } from './tracking.service.js';

export const getDriverTracking = async (req, res) => {
    try {
        const { driver_id } = req.params;
        const { date, order_id } = req.query; 

        if (!driver_id || !order_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Thiếu mã tài xế hoặc mã đơn hàng' 
            });
        }

        const trackingData = await fetchTrackingHistory(driver_id, order_id, date);

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