import { RequestHandler } from "express";
import createHttpError from "http-errors";
import StaffModel from "../models/staff";

export const getAuthenticatedStaff: RequestHandler = async (req, res, next) => {
    try {
        const role = "staff";

        if (!req.session.staffId) {
            return next(createHttpError(401, "Staff not authenticated"));
        }

        const staff = await StaffModel.findById(req.session.staffId).select("+role").exec();

        if (!staff) {
            return next(createHttpError(401, "Staff not authenticated"));
        } else if (staff.role === role) {
            console.log("Staff authenticated:", staff);
            return next();
        } else {
            return next(createHttpError(401, "Staff not authorized"));
        }
    } catch (error) {
        console.error("Error in getAuthenticatedStaff middleware:", error);
        return next(createHttpError(500, "Internal Server Error"));
    }
};

export const userAuth: RequestHandler = (req, res, next) => {
    try {
        if (req.session.userId) {
            console.log("User authenticated:", req.session.userId);
            return next();
        } else {
            return next(createHttpError(401, "User not authenticated"));
        }
    } catch (error) {
        console.error("Error in userAuth middleware:", error);
        return next(createHttpError(500, "Internal Server Error"));
    }
};
