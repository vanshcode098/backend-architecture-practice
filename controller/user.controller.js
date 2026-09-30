import { createUserService } from "../routes/user.routes.js";


export const createUser= async(req,res)=>{
        const user =await createUserService(req.body);
        return res.status(201).json({
            user
        });
}