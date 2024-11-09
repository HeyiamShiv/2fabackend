import { RequestHandler } from "express";
import { CustomRequest } from "../@types/type";
import { prisma } from "../utils/prismaClient";
import { exclude, generateFailureResponse } from "../utils/utils";
import { Prisma } from "@prisma/client";
import { sendMail } from "../utils/sendMail";

export const getUserDetails: RequestHandler = async (req: CustomRequest, res, next) => {
    try {
        const user = await prisma.user.findUniqueOrThrow({
            where: {
                user_id: req.userId
            }
        })

        if(!user) generateFailureResponse("No such user found")
        
        const processUserData = exclude(user, ['password'])
        
        res.send({
            ...processUserData,
        })  
    } catch (err) {
        next(err)
    }
}


export const deleteUser: RequestHandler = async (req: CustomRequest, res, next) => {
    try{
        const { user_id } = req.params
        if(!user_id) generateFailureResponse("User ID is required");
        const userId = parseInt(user_id);

        if(isNaN(userId)) generateFailureResponse("User ID need to be number");

        if(!req.isAdmin) generateFailureResponse("Only admin is allowed to delete a user.")

        const user = await prisma.user.delete({
            where: {
                user_id: userId,
            }
        })

        sendMail(user.email, 'You account has been deleted', "You account has been deleted")
        
        res.send({
            message: "User deleted successfully"
        })
    }catch(err){

        next(err)
    }
}

export const enable2FA: RequestHandler = async (req: CustomRequest, res, next) => {
    try {
        const { user_id } = req.params
        if(!user_id) generateFailureResponse("User ID is required");
        const userId = parseInt(user_id);

        if(isNaN(userId)) generateFailureResponse("User ID need to be number");

        const user = await prisma.user.findUnique({
            where: {
                user_id: userId,
            }
        })

        if(!user) generateFailureResponse("User does not exist.")

        if(!user.emailVerified) generateFailureResponse("User email is not verified.")

        await prisma.user.update({
            where: {
                user_id: user.user_id
            },
            data: {
                enabled_2fa: req.body.enable
            }
        })

        res.send({
            message: req.body.enable ? "Enabled 2FA" : "Disabled 2FA"
        })

    }catch(err){
        next(err)
    }
}