import { User } from "@prisma/client"
import * as jwt from "jsonwebtoken"
import { exclude, generateOTP } from "./utils"
import { sendMail } from "./sendMail"
import { JWT_SECRET_KEY, TokenType } from "../constants/constants"
import { prisma } from "./prismaClient"
import _ from "lodash"

export const generateToken = (user: User , tokenType: TokenType, options: jwt.SignOptions = {}) => {
    const token = jwt.sign({
        ...exclude(user, ['password']),
        tokenType, 
    }, JWT_SECRET_KEY,
    options)

    return token
}

export const sendVerificationEmail = async (user: User, tokenType: TokenType) => {
    const token = generateToken(user, tokenType)
    const setupURL = `${process.env.FRONTEND_URL}/verify?token=${token}`
    await sendMail(user.email, 'Verify your email and set up your org.', setupURL)
}


export const sendResetPasswordEmail = async (email: string, token: string) => {
    const resetPasswordURL = `${process.env.FRONTEND_URL}/reset_password?token=${token}`
    await sendMail(email, `Reset Password`, resetPasswordURL)
}

export async function generateAndStoreOTP(email) {
    const otpCode = generateOTP();
  
    // Set expiration time to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
    // Store the OTP in the database
    
    const otpEntry = await prisma.oTP.create({
      data: {
        code: otpCode,
        expiresAt: expiresAt,
        email: email,
      },
    });

    sendMail(email,"Verification OTP", `Your OTP is: ${otpCode}. This otp will expire in 10 minutes`)
  
    return otpEntry;
  }