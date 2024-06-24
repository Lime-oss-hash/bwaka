import { RequestHandler } from "express";
import createHttpError from "http-errors";
import StaffModel from "../models/staff";

// Middleware to verify authentication of staff based on session
export const getAuthenticatedStaff: RequestHandler = async (req, res, next) => {
    const role = "staff"; // Define the role expected for staff members

    // Find staff member by session staffId and select role field
    const staff = await StaffModel.findById(req.session.staffId).select("+role").exec();
    
    // If staff member not found, pass error to Express error handler
    if (!staff) {
        next(createHttpError(401, "Staff not authenticated"));
    } else if (staff.role == role) { // If role matches expected role, proceed to next middleware
        next();
    } else { // If role does not match expected role, pass error to Express error handler
        next(createHttpError(401, "Staff not authenticated"));
    }
};

// Middleware to verify authentication of user based on session
export const userAuth: RequestHandler = (req, res, next) => {
    // Check if userId exists in session
    if (req.session.userId) {
        next(); // If user authenticated, proceed to next middleware
    } else {
        next(createHttpError(401, "User not authenticated")); // If user not authenticated, pass error to Express error handler
    }
};
