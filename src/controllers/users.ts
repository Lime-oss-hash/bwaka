import { RequestHandler } from "express";
import env from "../util/validateEnv";
import nodemailer from "nodemailer";
import UserModel from "../models/user";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import { signJWT, verifyJWT } from "../util/jwt.utils";
import mongoose from "mongoose";

// Configuration for nodemailer using environment variables
const config = {
    host: env.SMTP_SERVER_ADDRESS,
    port: env.SMTP_PORT,
    secure: false, // Whether to use SSL/TLS, in this case, it's false
    auth: {
        user: env.SMTP_LOGIN,
        pass: env.SMTP_PASSWORD,
    },
};

// Create a nodemailer transporter instance
const transporter = nodemailer.createTransport(config);

// Middleware to get authenticated user details based on session
export const getAuthenticatedUser: RequestHandler = async (req, res, next) => {
    try {
        // Find user by session userId and select email field
        const user = await UserModel.findById(req.session.userId).select("+email").exec();
        res.status(200).json(user); // Respond with user details
    } catch (error) {
        next(error); // Pass error to Express error handler
    }
};

// Interface defining expected request body for user sign-up
interface UserSignUpBody {
    username?: string,
    password?: string,
    firstName?: string,
    lastName?: string,
    dob?: string,
    email?: string,
    address?: string,
    town?: string,
    postcode?: string,
    phoneNumber?: string,
    altPhoneNumber?: string,
    gender?: string,
    ethnicity?: string,
    disability?: string,
    disabilityDetails?: string,
    assistance?: string,
    emergencyName?: string,
    emergencyPhone?: string,
    emergencyRelationship: string,
    role?: string,
}

// Middleware to handle user sign-up
export const UserSignUp: RequestHandler<unknown, unknown, UserSignUpBody, unknown> = async (req, res, next) => {
    const username = req.body.username;
    const passwordRaw = req.body.password;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const dob = req.body.dob;
    const email = req.body.email;
    const address = req.body.address;
    const town = req.body.town;
    const postcode = req.body.postcode;
    const phoneNumber = req.body.phoneNumber;
    const altPhoneNumber = req.body.altPhoneNumber;
    const gender = req.body.gender;
    const ethnicity = req.body.ethnicity;
    const disability = req.body.disability;
    const disabilityDetails = req.body.disabilityDetails;
    const assistance = req.body.assistance;
    const emergencyName = req.body.emergencyName;
    const emergencyPhone = req.body.emergencyPhone;
    const emergencyRelationship = req.body.emergencyRelationship;
    const role = "user"; // Default role for new users

    try {
        // Check if required parameters are missing
        if (!username || !passwordRaw) {
            throw createHttpError(400, "Parameters missing");
        }

        // Check if username already exists in the database
        const existingUsername = await UserModel.findOne({ username: username }).exec();
        if (existingUsername) {
            throw createHttpError(409, "Username already taken. Please choose a different username or log in instead");
        }

        // Hash the password before storing it in the database
        const passwordHashed = await bcrypt.hash(passwordRaw, 10);

        // Create a new user document in the database
        const newUser = await UserModel.create({
            username: username,
            password: passwordHashed,
            firstName: firstName,
            lastName: lastName,
            dob: dob,
            email: email,
            address: address,
            town: town,
            postcode: postcode,
            phoneNumber: phoneNumber,
            altPhoneNumber: altPhoneNumber,
            gender: gender,
            ethnicity: ethnicity,
            disability: disability,
            disabilityDetails: disabilityDetails,
            assistance: assistance,
            emergencyName: emergencyName,
            emergencyPhone: emergencyPhone,
            emergencyRelationship: emergencyRelationship,
            role: role,
        });

        // Generate an access token (JWT) for account activation
        const accessToken = signJWT({ email: newUser.email }, "24h");

        // Construct an activation link for the email
        const link = `http://localhost:3000/resetpassword/${newUser._id}`;

        // Send an email to notify user about account approval
        const data = await transporter.sendMail({
            "from": "xinbai24@student.wintec.ac.nz",
            "to": "xinbai24@student.wintec.ac.nz",
            "subject": "Your Application has been approved",
            "html": `<p>Dear ${firstName}, ${lastName}</p>
            <p>We would love to inform you that your application with Waka Eastern Bay Community Transport has been approved.</p>
            <p>Please click the <a href="${link}"> link</a> to activate your account.</p>
            <p>This link will only be valid for 24 hours from the time you received this email.</p>
            <p>Please click the "forgot password" again if the link has expired.</p>
            <p>Ngā mihi/Kind regards.</p>
            <p>Reneé Lubbe</p>
            <p>Project Manager</p>
            <p><a href="https://wakaeasternbay.org.nz">https://wakaeasternbay.org.nz</a></p>
            <p>Waka Eastern Bay Community Transport</p>`
        });

        // Log the response after sending the email
        console.log("Message sent: %s", data.response);

        // Respond with the access token
        res.status(201).json(accessToken);
    } catch (error) {
        next(error); // Pass error to Express error handler
    }
};

// Interface defining expected request body for user login
interface UserLoginBody {
    username?: string,
    password?: string,
}

// Middleware to handle user login
export const UserLogin: RequestHandler<unknown, unknown, UserLoginBody, unknown> = async (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        // Check if required parameters are missing
        if (!username || !password) {
            throw createHttpError(400, "Parameters missing");
        }

        // Find user by username and select password and username fields
        const user = await UserModel.findOne({ username: username }).select("+password +username").exec();

        // If user not found, throw unauthorized error
        if (!user) {
            throw createHttpError(401, "Username is incorrect");
        }

        // Compare entered password with stored hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);

        // If passwords don't match, throw unauthorized error
        if (!passwordMatch) {
            throw createHttpError(401, "Password is incorrect");
        }

        // Set userId in session to authenticate user
        req.session.userId = user._id;

        // Respond with user details
        res.status(201).json(user);

    } catch (error) {
        next(error); // Pass error to Express error handler
    }
};

// Middleware to handle user logout
export const UserLogout: RequestHandler = (req, res, next) => {
    req.session.destroy(error => {
        if (error) {
            next(error); // Pass error to Express error handler
        } else {
            res.sendStatus(200); // Respond with success status
        }
    });
};

// Interface defining expected request body for forgot password
interface ForgotPasswordBody {
    email?: string,
}

// Middleware to handle forgot password request
export const ForgotPassword: RequestHandler<unknown, unknown, ForgotPasswordBody, unknown> = async (req, res, next) => {
    const email = req.body.email;

    try {
        // Check if required parameters are missing
        if (!email) {
            throw createHttpError(400, "Parameters missing");
        }

        // Find user by email and select email field
        const user = await UserModel.findOne({ email: email }).select("+email").exec();

        // If user not found, throw not found error
        if (!user) {
            throw createHttpError(404, "User not found");
        }

        // Generate an access token (JWT) for password reset
        const accessToken = signJWT({ email: user.email }, "1h");

        // Construct a reset password link for the email
        const link = `http://localhost:3000/forgotpasswordpage/${user._id}`;

        // Send an email to notify user about password reset
        const data = await transporter.sendMail({
            "from": "xinbai24@student.wintec.ac.nz",
            "to": "xinbai24@student.wintec.ac.nz",
            "subject": "Reset your password",
            "html": `<p>Dear ${user.firstName}, ${user.lastName}</p>
            <p>Please click the <a href="${link}"> link</a> to change your current password.</p>
            <p>This link will only be valid for 1 hour from the time you received this email.</p>
            <p>Please click the "reset password" again if the link has expired.</p>
            <p>Ngā mihi/Kind regards.</p>
            <p>Reneé Lubbe</p>
            <p>Project Manager</p>
            <p><a href="https://wakaeasternbay.org.nz">https://wakaeasternbay.org.nz</a></p>
            <p>Waka Eastern Bay Community Transport</p>`
        });

        // Respond with the email response
        res.status(200).json(data.response);
        res.status(200).json(accessToken); // Respond with the access token

    } catch (error) {
        next(error); // Pass error to Express error handler
    }
};

// Interface defining expected request parameters for changing password
interface ChangePasswordParams {
    userId: string,
    accessToken: string,
}

// Interface defining expected request body for changing password
interface ChangePasswordBody {
    password?: string,
}

// Middleware to handle changing user password
export const ChangePassword: RequestHandler<ChangePasswordParams, unknown, ChangePasswordBody, unknown> = async (req, res, next) => {
    const passwordRaw = req.body.password;
    const userId = req.params.userId;
    const accessToken = req.params.accessToken;

    try {
        // Validate userId format
        if (!mongoose.isValidObjectId(userId)) {
            throw createHttpError(400, "Invalid user Id");
        }

        // Find user by userId
        const user = await UserModel.findById(userId).exec();

        // If user not found, throw not found error
        if (!user) {
            throw createHttpError(404, "User not found");
        }

        // Check if password parameter is missing
        if (!passwordRaw) {
            throw createHttpError(400, "Parameters missing");
        }

        // Set access token in cookie with max age and httpOnly flag
        res.cookie("accessToken", accessToken, {
            maxAge: 100 * 36000, // Example max age in milliseconds
            httpOnly: true, // Only accessible via HTTP(S) request
        });

        // Verify JWT access token and return its payload
        res.send(verifyJWT(accessToken).payload);

        // Hash the new password before updating in database
        const passwordHashed = await bcrypt.hash(passwordRaw, 10);

        // Update user password in database
        user.password = passwordHashed;
        const changePassword = await user.save();

        // Respond with the updated user object
        res.status(200).json(changePassword);
    } catch (error) {
        next(error); // Pass error to Express error handler
    }
};
