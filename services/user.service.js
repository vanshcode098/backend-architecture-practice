import  User from "../models/User.js"
import { findTaskById } from "../repositories/task.repository.js";



export const createUserService= async(data)=>{
    const user= await User.create({
        name: data.name,
        email: data.email
    });
    return user;
};



export const getTaskService= async(id) =>
{
    const task= await findTaskById(id);

    return task;
};