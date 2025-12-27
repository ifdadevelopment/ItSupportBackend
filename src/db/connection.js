import mongoose from "mongoose";


const connectionToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
    } catch (error) {
        throw new Error("MongoDb Cloud Connection Failed");
    }
}

export default connectionToDatabase;