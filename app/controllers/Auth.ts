import { RequestHandler } from "express"
import { prisma } from "../utils/prismaClient"
import { exclude, generateFailureResponse } from "../utils/utils"
import * as bcrypt from "bcrypt"
import { generateAndStoreOTP, generateToken, sendResetPasswordEmail, sendVerificationEmail } from "../utils/setupOrg"
import { FRONTEND_URL, JWT_SECRET_KEY, TokenType } from "../constants/constants"
import jwt, { JwtPayload } from "jsonwebtoken"
import { logger } from "../utils/logger"

export const login: RequestHandler = async (req, res, next) => {
    try{
        const {email, password} = req.body

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if(!user) generateFailureResponse(`No user with email ${email} found. First sign up`)
        
        const passwordMatch = await bcrypt.compare(password, user.password)

        if(!passwordMatch){
            generateFailureResponse("Invalid Password", 404)
        }

        if(!user.emailVerified){
            sendVerificationEmail(user, TokenType.SIGN_UP)
            generateFailureResponse("Email not verified, check you email.");
        }

        if(user.enabled_2fa){
            // generateFailureResponse("Need OTP")
            generateAndStoreOTP(user.email)
            
            res.send({
                type: TokenType.OTP,
                message: "OTP has been sent to your email"
            })
        }
        
        res.send({
           type: TokenType.LOGIN,
           token: generateToken(user, TokenType.LOGIN)
        })

    }catch(err){
        next(err)
    }
}

export const signup: RequestHandler = async (req, res, next) => {
    try {

        const {email, password , name} = req.body
        if(!name) generateFailureResponse('Name field is required')
        if(!email) generateFailureResponse('Email field is required')
        if(!password) generateFailureResponse('Password field is required')

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if(!user){
            const encryptedPassword = await bcrypt.hash(password, 13)

            const newUser = await prisma.user.create({
                data: {
                    email,
                    password: encryptedPassword,
                    name
                }
            })
            sendVerificationEmail(newUser, TokenType.SIGN_UP)

            return res.send({
                message: "User successfully signed up! Check up your email for verification!"
            })
        }
        
    } catch(err){
        next(err)
    }
}



export const resetPassword: RequestHandler = async (req, res, next) => {
    try{
        const { email } = req.body;

        if(!email) generateFailureResponse("Email is required!");

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if(!user) generateFailureResponse("User with this email does not exist")

        await sendResetPasswordEmail(user.email, generateToken(user, TokenType.RESET_PASSWORD, {
            expiresIn: '1d'
        }))

        res.send({message: "Mail sent successfully for reset password."})
    }catch(err){
        next(err)
    }
}

export const updatePassword: RequestHandler = async (req, res, next) => {
    try{
        const { token, password } = req.body
        
        if(!token) generateFailureResponse("Token required.");
        if(!password) generateFailureResponse("Password required")
        
        const payload = jwt.verify(token, JWT_SECRET_KEY)  
        const { user_id, tokenType } = payload as JwtPayload
        
        if(!tokenType) generateFailureResponse("Token Missing");
        if(tokenType !== TokenType.RESET_PASSWORD) generateFailureResponse("Invalid token type");
        
        if(!user_id) generateFailureResponse("User Id missing from token");
        
        const encryptedPassword = await bcrypt.hash(password, 13)

        await prisma.user.update({
            data: {
                password: encryptedPassword,
            },
            where: {
                user_id: user_id
            }
        })

        res.send({
            message: "Password Updated Successfully!"
        })

    }catch(err){
        next(err)
    }
}


export const verifyUserEmail: RequestHandler = async (req, res, next) => {
    try{
        const { token } = req.params
        if (!token) generateFailureResponse("No Token Provided!")
        
        const payload = jwt.verify(token, JWT_SECRET_KEY)
        const {user_id, tokenType} = payload as JwtPayload
        if(tokenType !== TokenType.SIGN_UP){
            generateFailureResponse("Invalid token type")
        }

        const user = await prisma.user.findUnique({
            where: {
                user_id: user_id
            }
        })

        if(!user) generateFailureResponse("User Not Found");

        if(user.emailVerified){
            generateFailureResponse("User is already verify")
        }

        user.emailVerified = true;
        
        await prisma.user.update({
            where: {
                user_id: user.user_id,
            },
            data: {
                emailVerified: true
            }
        })

        res.send({
            message: "Email Verified Successfully!, proceed to login."
        })

    }catch(err){
        next(err)
    }
}

export const verifyOTP: RequestHandler = async (req, res, next) => {
    try{
        const { email, otp } = req.body
        if (!email) generateFailureResponse("Email missing!")
        if (!otp) generateFailureResponse("OTP missing!")
       
        const otpEntry = await prisma.oTP.findFirst({
            where: {
                email: email,
                code: otp,
                expiresAt: {
                gte: new Date(), // Check if it hasn't expired
                },
                verified: false, // Ensure it hasn't been used
            },
        });

        if (!otpEntry) {
            generateFailureResponse('Invalid or expired OTP.');
        }

        await prisma.oTP.update({
            where: { otp_id: otpEntry.otp_id },
            data: { verified: true },
        });


        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if(!user) generateFailureResponse("User Not Found");

        res.send({
            type: TokenType.LOGIN,
            token: generateToken(user, TokenType.LOGIN)
         })

    }catch(err){
        next(err)
    }
}