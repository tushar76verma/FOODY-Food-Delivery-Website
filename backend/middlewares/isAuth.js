import jwt from "jsonwebtoken"
const isAuth=async (req,res,next) => {
    try {
        const token=req.cookies.token
        if(!token){
            return res.status(401).json({message:"token not found"})
        }
        const decodeToken=jwt.verify(token,process.env.JWT_SECRET)
        if(!decodeToken){
 return res.status(401).json({message:"token not verify"})
        }
        req.userId=decodeToken.userId
        next()
    } catch (error) {
         return res.status(401).json({message:"invalid or expired token"})
    }
}

export default isAuth
