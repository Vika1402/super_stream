import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String, //cloudinary
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required !"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

//following code show where we bcvrypt out user password to just save in database using pre and save option by mongoose
//pre is a triggerd fun where we pass our operation like save and made as middlewares !!
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//after we make a userScema.methodsas function we can pass this function as ------- using login time
//code use in controller when user login
// const isPasswordValid = await user.isPasswordCorrect(password);
// if (!isPasswordValid) {
//   throw new ApiError(401, "Invalid user credentials");
// }
//-----------and perform user is correct password or not using bcrypt.compare(user_current_password,database_password) function
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//followinf code expalin about how to generete token using jwt ------gain we craeet a methods for userrSchema when user login and there password is correct soo
//code use in controoller
// const { accessToken, refreshToken } = await generateAccessAnsRefreshTokens(
//   user._id
// );
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
