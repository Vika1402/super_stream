import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
//this verification function  is importtant for logout, when we logout the user which alreeady login and generated thier refresh and accesstoken if as cookies.accesstoken becouse in login time we give the cookies ans store in teken variable if this avalible so we chan check jwt.verify and token and jwtsecret token ,is true so we give so we find user bby therir id with if decoded present and return user withouth taking prassword and refresh token and set req.user=user and this we can use as req.user.id and update token that work of auth middlewares
export const verifyJwt = asyncHandler(async (req, _, next) => {
  try {
    //in line just we find the refresh token which store in cookie alredy cause of user login 
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "UnAuthorized request");
    }
    const decodededToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodededToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      //next:disscuss about frontend
      throw new ApiError(401, "invalid access Token"); 
    }

    req.user = user;
    next();

  } catch (error) {
    throw new ApiError(404, error?.message || "invalid access Token");
  }
});
