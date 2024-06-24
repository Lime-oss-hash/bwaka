import { RequestHandler } from "express";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import RosterModel from "../models/roster";

// Handler to get all rosters
export const getRosters: RequestHandler = async (req, res, next) => {
    try {
        const rosters = await RosterModel.find().exec();
        res.status(200).json(rosters);
    } catch (error) {
        next(error);
    }
};

// Handler to get a specific roster by ID
export const getRoster: RequestHandler = async (req, res, next) => {
    const rosterId = req.params.rosterId;

    try {
        if (!mongoose.isValidObjectId(rosterId)) {
            throw createHttpError(400, "Invalid roster id");
        }

        const roster = await RosterModel.findById(rosterId).exec();

        if (!roster) {
            throw createHttpError(404, "Roster not found");
        }

        res.status(200).json(roster);
    } catch (error) {
        next(error);
    }
};

// Interface for the request body of creating a new roster entry
interface CreateRosterBody {
    date?: string,
    driverName?: string,
    vehiclePlate?: string,
    startTime?: string,
    finishTime?: string,
    availabilityTime?: string[],
    availabilityStatus?: string[],
}

// Handler to create a new roster entry
export const createRoster: RequestHandler<unknown, unknown, CreateRosterBody, unknown> = async (req, res, next) => {
    const {
        date, driverName, vehiclePlate, startTime, finishTime, availabilityTime, availabilityStatus
    } = req.body;

    try {
        // Validate required fields for roster creation
        if (!driverName || !vehiclePlate || !startTime || !finishTime) {
            throw createHttpError(400, "Roster must include these information");
        }

        // Create new roster entry
        const newRoster = await RosterModel.create({
            date, driverName, vehiclePlate, startTime, finishTime, availabilityTime, availabilityStatus
        });

        res.status(201).json(newRoster);
    } catch (error) {
        next(error);
    }
};

// Interface for the request parameters of updating a roster entry
interface UpdateRosterParams {
    rosterId: string,
}

// Interface for the request body of updating a roster entry
interface UpdateRosterBody {
    date?: string,
    driverName?: string,
    vehiclePlate?: string,
    startTime?: string,
    finishTime?: string,
    availabilityTime?: string[],
    availabilityStatus?: string[],
}

// Handler to update a roster entry by ID
export const updateRoster: RequestHandler<UpdateRosterParams, unknown, UpdateRosterBody, unknown> = async (req, res, next) => {
    const rosterId = req.params.rosterId;
    const {
        date, driverName, vehiclePlate, startTime, finishTime, availabilityTime, availabilityStatus
    } = req.body;

    try {
        if (!mongoose.isValidObjectId(rosterId)) {
            throw createHttpError(400, "Invalid roster id");
        }
        if (!date || !driverName || !vehiclePlate || !startTime || !finishTime || !availabilityTime || !availabilityStatus) {
            throw createHttpError(400, "Roster must include these information");
        }

        // Find the roster entry by ID
        const roster = await RosterModel.findById(rosterId).exec();

        if (!roster) {
            throw createHttpError(404, "Roster not found");
        }

        // Update the roster entry fields
        roster.date = date;
        roster.driverName = driverName;
        roster.vehiclePlate = vehiclePlate;
        roster.startTime = startTime;
        roster.finishTime = finishTime;
        roster.availabilityTime = availabilityTime;
        roster.availabilityStatus = availabilityStatus;

        // Save the updated roster entry
        const updateRoster = await roster.save();

        res.status(200).json(updateRoster);
    } catch (error) {
        next(error);
    }
};

// Handler to delete a roster entry by ID
export const deleteRoster: RequestHandler = async (req, res, next) => {
    const rosterId = req.params.rosterId;

    try {
        if (!mongoose.isValidObjectId(rosterId)) {
            throw createHttpError(400, "Invalid roster id");
        }
        // Find the roster entry by ID
        const roster = await RosterModel.findById(rosterId).exec();

        if (!roster) {
            throw createHttpError(404, "Roster not found");
        }

        // Delete the roster entry
        await roster.deleteOne();

        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
};
