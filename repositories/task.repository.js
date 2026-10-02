import Task from "../models/task";

 export const  findTaskById=async (id)=>{
    return await Task.findById(id);
};