import mongoose from "mongoose";


const taskSchema= new mongoose.Schema({

    title:{
        type: string,
        required: true
    },

    status:{
        type: string,
        enum: ["pendinng","completed"],
        default: "pending"
    },

    userId:{
         type: mongoose.Schema.Types.ObjectId,
         ref: "user",
         required: true
    }
});

const Task = mongoose.model("task",taskSchema);
 export default Task;