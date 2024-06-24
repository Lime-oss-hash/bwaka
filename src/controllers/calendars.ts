import { RequestHandler } from "express";
import CalendarModel from "../models/calendar";
import BookingModel from "../models/booking";
import mongoose from "mongoose";
import createHttpError from "http-errors";

// Handler to get month calendars with counts of bookings on specified dates
export const getMonthCalendars: RequestHandler = async (req, res, next) => {
    try {
        const datesToSearch = req.body.dateArr as string[];

        // Aggregate to count bookings by date
        const aggregationResult = await BookingModel.aggregate([
            {
                $match: {
                    date: { $in: datesToSearch } // Match dates in the provided array
                }
            },
            {
                $group: {
                    _id: '$date',  // Group by date
                    count: { $sum: 1 }  // Count documents for each date
                }
            }
        ]);

        // Initialize result array with all target dates and count as 0
        const result = datesToSearch.map(date => ({
            date,
            count: 0
        }));

        // Update count for existing dates in the result array
        aggregationResult.forEach(item => {
            const index = result.findIndex(r => r.date === item._id);
            if (index !== -1) {
                result[index].count = item.count;
            }
        });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// Handler to get all calendar entries
export const getCalendars: RequestHandler = async (req, res, next) => {
    try {
        const calendars = await CalendarModel.find().exec();
        res.status(200).json(calendars);
    } catch (error) {
        next(error);
    }
};

// Handler to get a specific calendar entry by ID
export const getCalendar: RequestHandler = async (req, res, next) => {
    const calendarId = req.params.calendarId;

    try {
        if (!mongoose.isValidObjectId(calendarId)) {
            throw createHttpError(400, "Invalid calendar id");
        }

        const calendar = await CalendarModel.findById(calendarId).exec();

        if (!calendar) {
            throw createHttpError(404, "Calendar not found");
        }

        res.status(200).json(calendar);
    } catch (error) {
        next(error);
    }
};

// Interface for the request body of creating a new calendar entry
interface CreateCalendarBody {
    date?: string,
    title?: string,
    description?: string,
    location?: string,
    startTime: string,
    endTime: string,
}

// Handler to create a new calendar entry
export const createCalendar: RequestHandler<unknown, unknown, CreateCalendarBody, unknown> = async (req, res, next) => {
    const { date, title, description, location, startTime, endTime } = req.body;

    try {
        // Validate required fields for calendar creation
        if (!date || !title || !description || !location || !startTime || !endTime) {
            throw createHttpError(400, "Calendar must include all required information");
        }

        // Create new calendar entry
        const newCalendar = await CalendarModel.create({
            date: date,
            title: title,
            description: description,
            location: location,
            startTime: startTime,
            endTime: endTime,
        });

        res.status(201).json(newCalendar);
    } catch (error) {
        next(error);
    }
};

// Interface for the request parameters of updating a calendar entry
interface UpdateCalendarParams {
    calendarId: string,
}

// Interface for the request body of updating a calendar entry
interface UpdateCalendarBody {
    date?: string,
    title?: string,
    description?: string,
    location?: string,
    startTime: string,
    endTime: string,
}

// Handler to update a calendar entry by ID
export const updateCalendar: RequestHandler<UpdateCalendarParams, unknown, UpdateCalendarBody, unknown> = async (req, res, next) => {
    const calendarId = req.params.calendarId;
    const { date, title, description, location, startTime, endTime } = req.body;

    try {
        // Validate calendar ID
        if (!mongoose.isValidObjectId(calendarId)) {
            throw createHttpError(400, "Invalid calendar id");
        }

        // Validate required fields for calendar update
        if (!date || !title || !description || !location || !startTime || !endTime) {
            throw createHttpError(400, "Calendar must include all required information");
        }

        // Find calendar entry by ID
        const calendar = await CalendarModel.findById(calendarId).exec();

        if (!calendar) {
            throw createHttpError(404, "Calendar not found");
        }

        // Update calendar fields
        calendar.date = date;
        calendar.title = title;
        calendar.description = description;
        calendar.location = location;
        calendar.startTime = startTime;
        calendar.endTime = endTime;

        // Save updated calendar entry
        const updatedCalendar = await calendar.save();

        res.status(200).json(updatedCalendar);
    } catch (error) {
        next(error);
    }
};

// Handler to delete a calendar entry by ID
export const deleteCalendar: RequestHandler = async (req, res, next) => {
    const calendarId = req.params.calendarId;

    try {
        // Validate calendar ID
        if (!mongoose.isValidObjectId(calendarId)) {
            throw createHttpError(400, "Invalid calendar id");
        }

        // Find calendar entry by ID
        const calendar = await CalendarModel.findById(calendarId).exec();

        if (!calendar) {
            throw createHttpError(404, "Calendar not found");
        }

        // Delete calendar entry
        await calendar.deleteOne();

        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
};
