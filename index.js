import express from "express";
import "./config/db.js";

import User from "./models/User.js";
import Session from "./models/session.js";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import { safeParse, z } from "zod";


const app = express();



app.use(express.json());

app.use(cookieParser());


// =======================
// AUTH MIDDLEWARE
// =======================

const authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies.accessToken;

        if (!token) {
            return res.status(401).json({
                message: "Access token missing"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (err) {

        return res.status(401).json({
            message: "Invalid or expired access token"
        });
    }
};


// =======================
// PROFILE
// =======================

app.get("/profile", authMiddleware, async (req, res) => {

    try {

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.json({
            user
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});


// =======================
// CREATE USER
// =======================

app.post("/users", async (req, res) => {

    try {

        const user = req.body;

        const { password } = user;

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        user.password = hashedPassword;

        await User.create(user);

        return res.status(201).json({
            message: "User created successfully"
        });

    } catch (err) {

        console.log(err);

        if (err.name === "ValidationError") {

            return res.status(400).json({
                message: "Bad request"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});


// =======================
// LOGIN
// =======================

app.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;


        // 1. Find user

        const user = await User.findOne({ email });

        if (!user) {

            return res.status(401).json({
                message: "Invalid credentials"
            });
        }


        // 2. Compare password

        const check = await bcrypt.compare(
            password,
            user.password
        );

        if (!check) {

            return res.status(401).json({
                message: "Invalid credentials"
            });
        }


        // 3. Create session

        const session = new Session({

            userId: user._id,

            expiresAt: new Date(
                Date.now() +
                7 * 24 * 60 * 60 * 1000
            )
        });


        // 4. Create access token

        const accessToken = jwt.sign(

            {
                id: user._id.toString(),
                role: user.role
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "15m"
            }
        );


        // 5. Create refresh token

        const refreshToken = jwt.sign(

            {
                userId: user._id.toString(),
                sessionId: session._id.toString()
            },

            process.env.JWT_REFRESH_SECRET,

            {
                expiresIn: "7d"
            }
        );


        // 6. Hash refresh token

        const refreshTokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");


        // 7. Store refresh token hash

        session.refreshTokenHash =
            refreshTokenHash;


        // 8. Save session

        await session.save();


        // 9. Access token cookie

        res.cookie(
            "accessToken",
            accessToken,
            {
                httpOnly: true,

                secure:
                    process.env.NODE_ENV ===
                    "production",

                sameSite: "strict"
            }
        );


        // 10. Refresh token cookie

        res.cookie(
            "refreshToken",
            refreshToken,
            {
                httpOnly: true,

                secure:
                    process.env.NODE_ENV ===
                    "production",

                sameSite: "strict"
            }
        );


        // 11. Response

        return res.status(200).json({

            message: "Login successful"

        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});


// =======================
// GET USER BY ID
// =======================

app.get(
    "/users/:id",
    authMiddleware,
    async (req, res) => {

        try {

            const userId = req.params.id;

            const person =
                await User.findById(userId);


            if (!person) {

                return res.status(404).json({
                    message: "User not found"
                });
            }


            return res.json({

                message: "User found",

                user: person

            });

        } catch (err) {

            console.log(err);

            return res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


// =======================
// UPDATE USER
// =======================

app.patch(
    "/users/:id",
    authMiddleware,
    async (req, res) => {

        try {

            const userId = req.params.id;


            // Check whether logged-in user
            // is updating his own account

            if (userId !== req.user.id) {

                return res.status(403).json({
                    message: "Not authorized"
                });
            }


            const data = req.body;


            const person =
                await User.findById(userId);


            if (!person) {

                return res.status(404).json({
                    message: "User not found"
                });
            }


            const updated =
                await User.findByIdAndUpdate(
                    userId,
                    data,
                    {
                        new: true,
                        runValidators: true
                    }
                );


            return res.json({

                message: "User updated successfully",

                user: updated

            });

        } catch (err) {

            console.log(err);

            if (err.name === "ValidationError") {

                return res.status(400).json({
                    message: "Bad request"
                });
            }

            return res.status(500).json({
                message: "Internal server error"
            });
        }
    }
);


// =======================
// REFRESH ACCESS TOKEN
// =======================

app.post("/refresh", async (req, res) => {

    try {

        // 1. Get refresh token

        const refreshToken =
            req.cookies.refreshToken;


        // 2. Check token

        if (!refreshToken) {

            return res.status(401).json({
                message: "Refresh token missing"
            });
        }


        // 3. Verify refresh token

        const decoded = jwt.verify(

            refreshToken,

            process.env.JWT_REFRESH_SECRET
        );


        // 4. Create new access token

        const accessToken = jwt.sign(

            {
                id: decoded.userId
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "15m"
            }
        );


        // 5. Store new access token

        res.cookie(

            "accessToken",

            accessToken,

            {
                httpOnly: true,

                secure:
                    process.env.NODE_ENV ===
                    "production",

                sameSite: "strict"
            }
        );


        // 6. Response

        return res.status(200).json({

            message: "Access token refreshed"

        });

    } catch (err) {

        console.log(err);

        return res.status(401).json({

            message:
                "Invalid or expired refresh token"

        });
    }
});


// =======================
// ROLE MIDDLEWARE
// =======================

const requireRole = (requiredRole) => {

    return async (req, res, next) => {

        try {

            const user =
                await User.findById(req.user.id)
                    .select("role");


            if (!user) {

                return res.status(401).json({
                    message: "User not found"
                });
            }


            if (user.role !== requiredRole) {

                return res.status(403).json({
                    message: "Access denied"
                });
            }


            next();

        } catch (err) {

            console.log(err);

            return res.status(500).json({
                message: "Internal server error"
            });
        }
    };
};


// =======================
// TEST ADMIN ROUTE
// =======================

app.get(
    "/admin",
    authMiddleware,
    requireRole("admin"),
    (req, res) => {

        res.json({
            message: "Welcome Admin"
        });
    }
);


// =======================
// LOGOUT
// =======================

app.post("/logout", async (req, res) => {

    try {

        res.clearCookie("accessToken");

        res.clearCookie("refreshToken");


        return res.status(200).json({

            message: "Logout successful"

        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({

            message: "Internal server error"

        });
    }
});


// =======================
// SERVER
// =======================

app.listen(3000, () => {

    console.log(
        "Server is listening at port 3000"
    );

});


// VALIDATION:

const userSchema= z.object({
    name:z.string().min(4),
    age: z.coerce.number().min(18).max(100),
    email:z.string().email(),
    password: z.string().min(8).max(16)
});

// for checking validation
const data = {
    name: "Rahul",
    age: 29,
    email: "rahul@gmail.com",
    password: "12345678"
};


const result = userSchema.safeParse(data);

console.log(result);


// Validate middleware


const validate= (schema,source)=>{
    return (req,res,next)=>{
        const result=schema.safeParse(req[source]);
         if (!result.success) {

            const errors = result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message
            }));

            return res.status(400).json({
                message: "Validation failed",
                errors
            });
        }

        req[source] = result.body;// source as dynamic property{body,params,query}
        next();
    };
};

// REALISTIC TASK SCHEMA:

const taskschema= z.object({
    title:z.string().min(4),
     status: z.enum([
        "pending",
        "in-progress",
        "completed"
    ]).default("pending"),

    priority: z.enum([
        "low",
        "medium",
        "high"
    ]).default("medium")
});


//  Ridefine():

const userschema= z.object({
    Password:z.string()
    .min(8),
    confirmPassword:z.string().min(8)
}).refine(
(data)=> data.Password===data.confirmPassword,
{
    
          message: "Password not match",
          path: ["confirmPassword"]
}
);

// transform:

const userSschema= z.object({
    name: z.string()
    .min(4)
    .transform(value=> value.trim()),
    email: z.string()
    .email()
    .transform(value=> value.trim().toLowerCase()),
    password: z.string()
    .min(4)
    .max(20)
    
});