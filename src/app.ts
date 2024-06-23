import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import staffRoutes from "./routes/staffs";
import userRoutes from "./routes/users";
import registerRoutes from "./routes/registers";
import bookingRoutes from "./routes/bookings";
import rosterRoutes from "./routes/rosters";
import calendarRoutes from "./routes/calendars";
import morgan from "morgan";
import env from "./util/validateEnv";
import MongoStore from "connect-mongo";
import session from "express-session";
import { getAuthenticatedStaff } from "./middleware/auth";
import createHttpError, { isHttpError } from "http-errors";
import cors from 'cors';
import cookieParser from "cookie-parser";

const app = express();

// Logger middleware to log HTTP requests in dev mode
app.use(morgan("dev"));

// Parse JSON bodies for incoming requests
app.use(express.json());

// Parse URL-encoded bodies for incoming requests
app.use(express.urlencoded({ extended: false }));

// Enable CORS with credentials and allowed origin
app.use(
    cors({
        credentials: true,
        origin: "*", // Allow requests from all origins
    })
);

// Parse cookies from incoming requests
app.use(cookieParser());

// Session middleware for managing user sessions
app.use(session({
    secret: env.SESSION_SECRET, // Session secret from environment variables
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 60 * 60 * 1000, // Session expires in 1 hour
    },
    rolling: true, // Extend session lifetime on each request
    store: MongoStore.create({
        mongoUrl: env.MONGO_CONNECTION_STRING // MongoDB connection string from environment variables
    }),
}));

// Route handlers for different API endpoints
app.use("/api/users", userRoutes); // Routes for user-related operations
app.use("/api/staffs", staffRoutes); // Routes for staff-related operations
app.use("/api/registers", registerRoutes); // Routes for registration-related operations
app.use("/api/rosters", getAuthenticatedStaff, rosterRoutes); // Routes for roster-related operations, with staff authentication middleware
app.use("/api/bookings", bookingRoutes); // Routes for booking-related operations
app.use("/api/calendars", calendarRoutes); // Routes for calendar-related operations

// Middleware for handling 404 errors (Endpoint not found)
app.use((req, res, next) => {
    next(createHttpError(404, "Endpoint not found"));
});

// Error handling middleware for all other errors
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error(error); // Log the error to console

    let errorMessage = "An unknown error occurred";
    let statusCode = 500;

    // If the error is an HTTP error, extract status and message
    if (isHttpError(error)) {
        statusCode = error.status;
        errorMessage = error.message;
    }

    // Send JSON response with error status and message
    res.status(statusCode).json({ error: errorMessage });
});

export default app; // Export the configured Express application
