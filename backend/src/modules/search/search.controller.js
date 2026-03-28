import * as SearchService from './search.service.js'
import logger from '../../config/logger.js';

export const searchAll = async (req, res) => {
    try {
        const { q, limit = 20 } = req.query;
        
        if (!q || !q.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "Vui lòng nhập từ khóa tìm kiếm",
                data: []
            });
        }

        const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
        const data = await SearchService.getGlobalSearch(q, parsedLimit);
        
        res.status(200).json({
            success: true,
            count: data.length,
            data: data
        });
    } catch (err) {
        logger.error(`Search error: ${err.message}`);
        res.status(500).json({ 
            success: false,
            error: "Lỗi hệ thống khi tìm kiếm"
        });
    }
}