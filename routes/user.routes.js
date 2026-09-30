import express from "express";
import { createUser } from "../controller/user.controller.js";
import { validate } from "../middleware/validate.middleware.js"
const router= express.Router();

router.post(
    "/users",
      validate(userschema),
    createUser

);

export default router;