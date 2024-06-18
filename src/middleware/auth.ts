import { RequestHandler } from "express";
import createHttpError from "http-errors";
import StaffModel from "../models/staff";

export const getAuthenticatedStaff: RequestHandler = async (req, res, next) => {
    const role = "staff";

    const staff = await StaffModel.findById(req.session.staffId).select("+role").exec();
    
    if (!staff) {
        next(createHttpError(401, "Staff not authenticated"));
    } else if (staff.role == role) {
        next();
    } else {
        next(createHttpError(401, "Staff not authenticated"));
    }
};

export const userAuth: RequestHandler = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        next(createHttpError(401, "User not authenticated"));
    }
};