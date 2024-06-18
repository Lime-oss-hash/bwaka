import express from "express";
import * as CalendarsController from "../controllers/calendars";
import {getMonthCalendars} from "../controllers/calendars";

const router = express.Router();

router.get("/", CalendarsController.getCalendars);

router.post("/getMonthCalendars", CalendarsController.getMonthCalendars);

router.get("/:calendarId", CalendarsController.getCalendars);

router.post("/", CalendarsController.createCalendar);

router.patch("/:calendarId", CalendarsController.updateCalendar);

router.delete("/:calendarId", CalendarsController.deleteCalendar);

export default router;
