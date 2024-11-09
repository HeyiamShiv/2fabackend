export const FRONTEND_URL = process.env.FRONTEND_URL
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

export enum TokenType {
    SIGN_UP = "SIGN_UP",
    LOGIN = "LOGIN",
    RESET_PASSWORD = "RESET_PASSWORD",
    OTP = "OTP"
}
