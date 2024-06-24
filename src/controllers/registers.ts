import { RequestHandler } from "express";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import env from "../util/validateEnv";
import nodemailer from "nodemailer";
import RegisterModel from "../models/register";
import bcrypt from "bcrypt";

// Nodemailer configuration based on environment variables
const config = {
    host: env.SMTP_SERVER_ADDRESS,
    port: env.SMTP_PORT,
    secure: false,
    auth: {
        user: env.SMTP_LOGIN,
        pass: env.SMTP_PASSWORD,
    },
};

const transporter = nodemailer.createTransport(config);

// Handler to get all register forms
export const getRegisters: RequestHandler = async (req, res, next) => {
    try {
        const registers = await RegisterModel.find().exec();
        res.status(200).json(registers);
    } catch (error) {
        next(error);
    }
};

// Handler to get a specific register form by ID
export const getRegister: RequestHandler = async (req, res, next) => {
    const registerId = req.params.registerId;

    try {
        if (!mongoose.isValidObjectId(registerId)) {
            throw createHttpError(400, "Invalid register id");
        }

        const register = await RegisterModel.findById(registerId).exec();

        if (!register) {
            throw createHttpError(404, "Register form not found");
        }

        res.status(200).json(register);
    } catch (error) {
        next(error);
    }
};

// Interface for the request body of creating a new register form
interface CreateRegisterBody {
    username?: string,
    password?: string,
    firstName?: string,
    lastName?: string,
    dob?: string,
    email?: string,
    address?: string,
    town?: string,
    postcode?: string,
    phoneNumber?: string,
    altPhoneNumber?: string,
    gender?: string,
    ethnicity?: string,
    disability?: string,
    disabilityDetails?: string,
    assistance?: string,
    emergencyName?: string,
    emergencyPhone?: string,
    emergencyRelationship?: string,
}

// Handler to create a new register form
export const createRegister: RequestHandler<unknown, unknown, CreateRegisterBody, unknown> = async (req, res, next) => {
    const {
        username, password, firstName, lastName, dob, email, address, town, postcode,
        phoneNumber, altPhoneNumber, gender, ethnicity, disability, disabilityDetails,
        assistance, emergencyName, emergencyPhone, emergencyRelationship
    } = req.body;

    try {
        // Validate required fields for register form creation
        if (!username || !password || !firstName || !lastName || !dob || !email || !address || !town ||
            !postcode || !phoneNumber || !gender || !ethnicity || !disability || !assistance ||
            !emergencyName || !emergencyPhone || !emergencyRelationship) {
            throw createHttpError(400, "Register form must include all required information");
        }

        // Hash the password before saving to database
        const passwordHashed = await bcrypt.hash(password, 10);

        // Create new register form entry
        const newRegister = await RegisterModel.create({
            username, password: passwordHashed, firstName, lastName, dob, email, address, town,
            postcode, phoneNumber, altPhoneNumber, gender, ethnicity, disability, disabilityDetails,
            assistance, emergencyName, emergencyPhone, emergencyRelationship,
        });

        res.status(201).json(newRegister);
    } catch (error) {
        next(error);
    }
};

// Handler to delete a register form with sending a denial email
export const deleteRegisterWithEmail: RequestHandler = async (req, res, next) => {
    const registerId = req.params.registerId;

    try {
        if (!mongoose.isValidObjectId(registerId)) {
            throw createHttpError(400, "Invalid register id");
        }

        const register = await RegisterModel.findById(registerId).exec();

        if (!register) {
            throw createHttpError(404, "Register form not found");
        }

        // Send denial email to the applicant
        const data = await transporter.sendMail({
            from: "xinbai24@student.wintec.ac.nz",
            to: register.email,
            subject: "Your Registration",
            html: `<p>Dear ${register.firstName} ${register.lastName},</p>
            <p>We are sorry to inform you that your registration application has been denied.</p>
            <p>We have found that you do not meet our requirements to receive our services.</p>
            <p>If you wish to speak further on this, you can contact us via our website at wakaeasterbay.org.nz</p>
            <p>Ngā mihi/Kind regards.</p>
            <p>Reneé Lubbe</p>
            <p>Project Manager</p>
            <p>Mobile: 027 4077526</p>
            <p>Facebook: wakaeasternbay</p>
            <p>https://wakaeasternbay.org.nz</p>`,
        });

        console.log("Message sent: %s", data.response);

        // Delete the register form from database
        await register.deleteOne();

        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
};

// Handler to delete a register form without sending an email
export const deleteRegisterWithoutEmail: RequestHandler = async (req, res, next) => {
    const registerId = req.params.registerId;

    try {
        if (!mongoose.isValidObjectId(registerId)) {
            throw createHttpError(400, "Invalid register id");
        }

        const register = await RegisterModel.findById(registerId).exec();

        if (!register) {
            throw createHttpError(404, "Register form not found");
        }

        // Delete the register form from database without sending email
        await register.deleteOne();

        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
};
