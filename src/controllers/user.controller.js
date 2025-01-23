import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
const generateAccessAnsRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    //if  user correct so gnerete access token and referesh token
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    // save({ validateBeforeSave: false }):
    // Adding the { validateBeforeSave: false } option skips the validation process entirely.
    // This is useful when you’re updating only a specific field (like refreshToken in your code) and you’re sure the rest ofthe document is already valid.
    // Skipping validation can improve performance for partial updates.
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user detail from frontends
  //validation -not empty
  //check if already exists: username email se
  //check for images ,check for avtar
  //upload them to cloudinary,avtar check in clodinary
  //create user oject - create entry in db
  //response as user restered
  //remove password and refresh token field
  //check for user creation
  //return response

  const { fullName, username, email, password } = req.body;
  console.log("Email :", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const userpresent = await User.findOne({ $or: [{ username }, { email }] });
  if (userpresent) {
    throw new ApiError(409, "User Email and username alreaddy exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registerd successfully"));
});

//Login Controller**********************************

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User does not exist!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAnsRefreshTokens(
    user._id
  );

  // Exclude sensitive fields from the response
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    // This ensures the cookie cannot be accessed by JavaScript running in the browser (e.g., using document.cookie).
    // It provides protection against cross-site scripting (XSS) attacks by preventing malicious scripts from accessing sensitive cookies (e.g., session or authentication tokens).
    httpOnly: true,
    // Secure: The Secure flag ensures cookies are sent only over encrypted HTTPS connections. This prevents attackers from intercepting cookies over insecure HTTP connections, protecting data from being stolen during transmission
    secure: process.env.NODE_ENV === "production", // Only secure in production
    // SameSite: Strict, cookies are sent only when the user is on the same site, helping to prevent Cross-Site //Request Forgery (CSRF) attacks.
    sameSite: "none",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    //find out the current refresh token
    const incomingrefereshToken =
      req.cookie.refereshToken || req.body.refereshToken;
    //check refresh token present or not
    if (!incomingrefereshToken) {
      throw new ApiError(401, "Unauthorized Request");
    }
    //check using jwt refresh token with access.token secret in env file
    const decodedToken = jwt.verify(
      incomingrefereshToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    //if we find decoed toen so find user with id
    const user = await User.findById(decodedToken?._id);
    //i duser not found retur erre
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    //if incomingtoken and user.refresh teoken not same then
    if (incomingrefereshToken !== user?.refereshToken) {
      throw new ApiError(404, "Refresh Token expired or use");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    //access the new token from genrete token ans assign as newRferes token and send with cookie refresh tokne as new refresh token "
    const { accessToken, newRefereshToken } =
      await generateAccessAnsRefreshTokens(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refereshToken", newRefereshToken, options)
      .json((200, { accessToken, newRefereshToken }, "Access Token refreshed"));
  } catch (error) {
    throw new ApiError(404, " Invalid refresh token ");
  }
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword) {
    throw new ApiError(404, "given password is not similar ");
  }
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All field Required");
  }

  const user = User.findByIdAndUpdate(
    req.user?.id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");

  res.status(200).json(new ApiResponse(200, user, "Acount details updated"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avnatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }
  const updatedUserwithAvatar = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedUserwithAvatar,
        "cover images updated successfully"
      )
    );
});

const updateCoverImage = asyncHandler(async () => {
  try {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
      throw new ApiError(400, "cover Image  file  is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
      throw new ApiError(400, "Error while uploading cover images");
    }
    const updatedUserwithCoverImage = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { updatedUserwithCoverImage },
          "cover images change successfully !"
        )
      );
  } catch (error) {
    throw new ApiError(404, "error in updating cover images");
  }
});

const getChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subbscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscriberCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "user channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async () => {
  req.user?._id;
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: "videos",
      localField: "watchHistory",
      foreignField: "_id",
      as: "watchHistory",
      pipeline: [
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",

            pipeline: [
              {
                $project: {
                  fullName: 1,
                  username: 1,
                  avatar: 1,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            owner: {
              $first: "$owner",
            },
          },
        },
      ],
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getChannelProfile,
  getWatchHistory,
};
