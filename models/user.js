import mongoose from "mongoose"


const userSchema= new mongoose.Schema({

   role: {
            type: String,
            enum:["user","admin"],
            default: "user"
   },
   name:{
    type: String,
    required: true
   },
   age:{
    type: Number,
    required:true
   },
   email:{
    type: String,
    required:true
   },
   password:{
      type: String,
      required:true
   }


});
const User= mongoose.model("User",userSchema);
export default User;