const mongoose = require('mongoose');
const connectDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log(`MongoDB Connected Successfully`);
    }catch(err){
        console.error(`DB connection failed ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;