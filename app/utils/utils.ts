import { PrismaClientInitializationError, PrismaClientKnownRequestError, PrismaClientRustPanicError, PrismaClientUnknownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";
import { ErrorRequestHandler } from "express";
import crypto from "crypto"
import { JWT_SECRET_KEY, TokenType } from "../constants/constants";
import * as jwt from "jsonwebtoken"
import { logger } from "./logger";

// excludes list of keys from object and return new object
export function exclude(obj: Object,keys: String[]) {
    return Object.fromEntries(
      Object.entries(obj).filter(([key]) => !keys.includes(key))
    )
}

export class CodedError extends Error {
    code: number;

    constructor(message: string, code: number) {
        super(message);
        this.code = code;
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export const generateFailureResponse = (message: string, code:number = 500) => {
    throw new CodedError(message, code)
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    logger.error(err)
    if(
        err instanceof PrismaClientValidationError ||
        err instanceof PrismaClientKnownRequestError || 
        err instanceof PrismaClientInitializationError || 
        err instanceof PrismaClientRustPanicError || 
        err instanceof PrismaClientUnknownRequestError
    ){
        return res.status(500).send({message: "Something went wrong in DB while entering data!"})
    }

    logger.warn(`${err.message}, ${err.code}`)
    const statusCode = typeof err?.code == 'string'? 500 : (err.code ?? 500)
    return res.status(statusCode).send({message: err.message})
}


export function generateAPIKey() {
    return crypto.randomBytes(14).toString('hex'); // Generate a 256-bit (32 bytes) random key and convert it to hexadecimal
}

export const createDummyEndEvent = (startTime: number, time: number) => {
    return {
        type: 5,
        data: {
            tag: "end"
        },
        timestamp: time,
        delay: time - startTime
    }
} 


export function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}