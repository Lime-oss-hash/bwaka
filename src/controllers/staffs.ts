import { RequestHandler } from "express";
import createHttpError from "http-errors";
import StaffModel from "../models/staff";

// Get the authenticated staff details
export const getAuthenticatedStaff: RequestHandler = async (req, res, next) => {
    const authenticatedStaffId = req.session.staffId;
    try {
        const staff = await StaffModel.findById(authenticatedStaffId).select("+email").exec();
        res.status(200).json(staff);
    } catch (error) {
        next(error);
    }
};

// Interface for staff sign-up request body
interface StaffSignUpBody {
    email?: string,
    password?: string,
    role?: string,
}

// Sign up a new staff member
export const StaffSignUp: RequestHandler<unknown, unknown, StaffSignUpBody, unknown> = async (req, res, next) => {
    const { email, password: passwordRaw } = req.body;
    const role = "staff";

    try {
        if (!email || !passwordRaw) {
            throw createHttpError(400, "Parameters missing");
        }

        if (!email.includes("@wakaeasternbay.org.nz")) {
            throw createHttpError(409, "Staff email must be registered with Waka Eastern Bay email address");
        }

        const existingEmail = await StaffModel.findOne({ email }).exec();
        if (existingEmail) {
            throw createHttpError(409, "A staff with this email address already exists. Please log in instead");
        }

        // Store the password in plain text
        const passwordPlainText = passwordRaw;

        const newStaff = await StaffModel.create({
            email,
            password: passwordPlainText,
            role,
        });

        req.session.staffId = newStaff._id;

        res.status(201).json(newStaff);
    } catch (error) {
        next(error);
    }
};

// Interface for staff login request body
interface StaffLoginBody {
    email?: string,
    password?: string,
}

// Log in a staff member
export const StaffLogin: RequestHandler<unknown, unknown, StaffLoginBody, unknown> = async (req, res, next) => {
    const { email, password } = req.body;
    
    try {
        if (!email || !password) {
            throw createHttpError(400, "Parameters missing");
        }

        const staff = await StaffModel.findOne({ email }).select("+password +email").exec();
        if (!staff) {
            throw createHttpError(401, "Email address is incorrect");
        }

        // Compare the provided password with the stored plain text password
        const passwordMatch = (password === staff.password);

        if (!passwordMatch) {
            throw createHttpError(401, "Password is incorrect");
        }

        req.session.staffId = staff._id;
        res.status(201).json(staff);
    } catch (error) {
        next(error);
    }
};

// Log out a staff member
export const StaffLogout: RequestHandler = (req, res, next) => {
    req.session.destroy(error => {
        if (error) {
            next(error);
        } else {
            res.sendStatus(200);
        }
    });
};
