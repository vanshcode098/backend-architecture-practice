import express from "express";
import userRoutes from "../routes/user.routes.js"
import { notFound } from "../middleware/notfound.middleware.js";
import { errorHandler } from "../middleware/error.middleware.js";




const app= express();
app.use(express.json());

app.use("/api",userRoutes);
app.use(notFound); 
app.use(errorHandler);


export default app;