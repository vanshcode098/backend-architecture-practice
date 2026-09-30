import  User from "../models/User.js"



export const createUserService= async(data)=>{
    const user= await User.create({
        name: data.name,
        email: data.email
    });
    return user;
};