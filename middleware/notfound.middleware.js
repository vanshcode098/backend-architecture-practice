



export const notFound= (req,res,next)=>{


    const error= new Error(
        `route not found:${req.originalUrl}`
    );

    error.statusCode=404;
    next(error);
};