import mongoose from "mongoose";

const DbCon = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://darkassasian001:rQ5POCC5ecq8COrB@papersetting.3kehm.mongodb.net/PaperSetting?retryWrites=true&w=majority&appName=PaperSetting");
        console.log('MongoDB is connected');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1); // Exit process on failure
    }
};

export default DbCon;
