// const mongoose = require('mongoose');
import mongoose from 'mongoose';

const connectMongo = async () => {
    const con = await mongoose.connect(process.env.MONGO_URI); 
    console.log("MongoDB Connected");
    console.log(`Đã kết nối vào Database: ${con.connection.name}`);
};
export default connectMongo;