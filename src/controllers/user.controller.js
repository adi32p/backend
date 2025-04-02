import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { response } from "express"

const registerUser = asyncHandler(async (req, res) => {
    //step1:get user details from frontend 
    //step2:validation - not empty
    //step3:check is user already exists - username,email
    //step4:check for images,check for avtar
    //step5:Upload them to cloudinary,check for avtar
    //step6:create user object-create entry in db
    //step7:remove password and refresh token field from response
    //step8:check for user creation
    //step9:return res

    //step:1
    const { fullName, email, username, password } = req.body
    //step:2
    if (
        [fullName, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    //step3:
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    //step4:
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.converImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.converImage) && req.files.converImage.length > 0) {
        coverImageLocalPath = req.files.converImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar files is required")
    }

    //step5:
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const converImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    //step6
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        converImage: converImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    //step7

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    //step8
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    //step9
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully ")
    )
})


export {
    registerUser,
}