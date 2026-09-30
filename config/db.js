import mongoose  from "mongoose"
import dotenv from "dotenv"


dotenv.config();


mongoose.connect(process.env.MONGO_URL)
.then(()=>{
    console.log("MongoDB connected");
})
.catch((err)=>{
    Console.log("MongoDB connection failed",err);
})