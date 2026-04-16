// const mongoose = require('mongoose');
import mongoose from 'mongoose';
import Restaurant from '../modules/restaurant/restaurantModel.js';
const connectMongo = async () => {
    try {
        const con = await mongoose.connect(process.env.MONGO_URI); 
        console.log("MongoDB Connected");
        await ensureRestaurantIndexes(); 
    } catch (err) {
        console.error("Lỗi kết nối MongoDB:", err.message);
    }
};

const ensureRestaurantIndexes = async () => {
  try {
    // 1. Đồng bộ index (Quét xem cái nào thiếu thì tạo, cái nào thừa thì xóa)
    const result = await Restaurant.syncIndexes();
    console.log('Đồng bộ Index thành công:', result);
  } catch (error) {
    if (error.code === 11000) {
      console.error('Lỗi: Trùng lặp dữ liệu khi tạo Index!');
    } else if (error.message.includes('2dsphere')) {
      console.error('Lỗi: Dữ liệu tọa độ không hợp lệ, không thể tạo Index 2dsphere!');
    } else {
      console.error('Lỗi khi đồng bộ Index:', error.message);
    }
  }
};

export default connectMongo;