const mongoose = require("mongoose");


const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`MongoDB Connected: ${connect.connection.host}`);
    }catch(error) {
        console.error("Database connection error:", error);
        process.exit(1);
        throw error;
    }
}

module.exports = connectDB;