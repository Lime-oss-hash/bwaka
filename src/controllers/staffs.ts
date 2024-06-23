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
    role?: string,
}

// Sign up a new staff member
export const StaffSignUp: RequestHandler<unknown, unknown, StaffSignUpBody, unknown> = async (req, res, next) => {
    const { email } = req.body;
    const role = "staff";

    try {
        if (!email) {
            throw createHttpError(400, "Parameters missing");
        }

        if (!email.includes("@wakaeasternbay.org.nz")) {
            throw createHttpError(409, "Staff email must be registered with Waka Eastern Bay email address");
        }

        const existingEmail = await StaffModel.findOne({ email }).exec();
        if (existingEmail) {
            throw createHttpError(409, "A staff with this email address already exists. Please log in instead");
        }

        const newStaff = await StaffModel.create({
            email,
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
}

// Log in a staff member
export const StaffLogin: RequestHandler<unknown, unknown, StaffLoginBody, unknown> = async (req, res, next) => {
    const { email } = req.body;
    
    try {
        if (!email) {
            throw createHttpError(400, "Parameters missing");
        }

        const staff = await StaffModel.findOne({ email }).exec();
        if (!staff) {
            throw createHttpError(401, "Email address is incorrect");
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
