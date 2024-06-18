import express from "express";
import * as BookingsContoller from "../controllers/bookings";
import { getAuthenticatedStaff, userAuth } from "../middleware/auth";

const router = express.Router();

router.get("/userview", userAuth, BookingsContoller.getBookings);

router.post("/staffview", BookingsContoller.getAllBookings);

router.post("/:bookingId", userAuth, BookingsContoller.getBookings);

router.post("/", userAuth, BookingsContoller.createBooking);

router.delete("/userview/:bookingId", userAuth, BookingsContoller.deleteUserBooking);

router.delete("/staffview/:bookingId", getAuthenticatedStaff, BookingsContoller.deleteStaffBooking);

router.get("/suggestBooking", BookingsContoller.suggestBooking);

export default router;
