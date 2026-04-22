import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import genToken from "../utils/token.js"
import { sendOtpMail, sendSignupOtpMail } from "../utils/mail.js"

const getCookieOptions = () => ({
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true
})

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const normalizeEmail = (value = "") => value.trim().toLowerCase()

const isRealEmail = (value = "") => emailRegex.test(normalizeEmail(value))

const verifyFirebaseIdToken = async (idToken) => {
    const firebaseApiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_APIKEY
    if (!firebaseApiKey) {
        throw new Error("firebase api key is not configured")
    }

    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ idToken })
    })

    if (!response.ok) {
        throw new Error("invalid firebase id token")
    }

    const data = await response.json()
    return data?.users?.[0] || null
}

const validateSignupFields = ({ fullName, email, password, mobile, role }) => {
    if (!fullName || !email || !password || !mobile || !role) {
        return "all fields are required."
    }
    if (!isRealEmail(email)) {
        return "please use a real email id."
    }
    if (password.length < 6) {
        return "password must be at least 6 characters."
    }
    if (mobile.length < 10) {
        return "mobile no must be at least 10 digits."
    }
    return null
}

export const sendSignupOtp = async (req, res) => {
    try {
        const { fullName, email, password, mobile, role } = req.body
        const validationError = validateSignupFields({ fullName, email, password, mobile, role })
        if (validationError) {
            return res.status(400).json({ message: validationError })
        }

        const normalizedEmail = normalizeEmail(email)
        const existingUser = await User.findOne({ email: normalizedEmail, isEmailVerified: true })
        if (existingUser) {
            return res.status(400).json({ message: "User Already exist." })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const otp = Math.floor(1000 + Math.random() * 9000).toString()

        let pendingUser = await User.findOne({ email: normalizedEmail })
        if (!pendingUser) {
            pendingUser = new User({ email: normalizedEmail })
        }

        pendingUser.fullName = fullName
        pendingUser.email = normalizedEmail
        pendingUser.loginId = normalizedEmail
        pendingUser.mobile = mobile
        pendingUser.role = role
        pendingUser.password = hashedPassword
        pendingUser.signupOtp = otp
        pendingUser.signupOtpExpires = Date.now() + 5 * 60 * 1000
        pendingUser.isEmailVerified = false

        await pendingUser.save()
        await sendSignupOtpMail(normalizedEmail, otp)

        return res.status(200).json({ message: "signup otp sent successfully" })
    } catch (error) {
        return res.status(500).json({ message: `send signup otp error ${error}` })
    }
}

export const verifySignupOtp = async (req, res) => {
    try {
        const { email, otp } = req.body
        const normalizedEmail = normalizeEmail(email)
        const user = await User.findOne({ email: normalizedEmail })

        if (!user || user.signupOtp !== otp || !user.signupOtpExpires || user.signupOtpExpires < Date.now()) {
            return res.status(400).json({ message: "invalid/expired otp" })
        }

        user.isEmailVerified = true
        user.signupOtp = undefined
        user.signupOtpExpires = undefined
        await user.save()

        const token = await genToken(user._id)
        res.cookie("token", token, getCookieOptions())

        return res.status(201).json(user)
    } catch (error) {
        return res.status(500).json({ message: `verify signup otp error ${error}` })
    }
}

export const signUp = async (req, res) => {
    return res.status(400).json({ message: "manual signup now requires otp verification. please request otp first." })
}

export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!password) {
            return res.status(400).json({ message: "password is required." })
        }
        const normalizedEmail = normalizeEmail(email)

        if (!isRealEmail(normalizedEmail)) {
            return res.status(400).json({ message: "please enter your registered real email id." })
        }

        const user = await User.findOne({ email: normalizedEmail })
        if (!user) {
            return res.status(400).json({ message: "User does not exist." })
        }
        if (!user.isEmailVerified) {
            return res.status(400).json({ message: "please verify your email with otp before signing in." })
        }
        if (!user.password) {
            return res.status(400).json({ message: "this account was created with google. please use google sign in." })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: "incorrect Password" })
        }

        const token = await genToken(user._id)
        res.cookie("token", token, getCookieOptions())

        return res.status(200).json(user)

    } catch (error) {
        return res.status(500).json({ message: `sign In error ${error.message || error}` })
    }
}

export const signOut = async (req, res) => {
    try {
        res.clearCookie("token")
        return res.status(200).json({ message: "log out successfully" })
    } catch (error) {
        return res.status(500).json(`sign out error ${error}`)
    }
}

export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body
        const normalizedEmail = normalizeEmail(email)
        if (!isRealEmail(normalizedEmail)) {
            return res.status(400).json({ message: "please enter your registered real email id." })
        }

        const user = await User.findOne({ email: normalizedEmail, isEmailVerified: true })
        if (!user) {
            return res.status(400).json({ message: "User does not exist." })
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString()
        user.resetOtp = otp
        user.otpExpires = Date.now() + 5 * 60 * 1000
        user.isOtpVerified = false
        await user.save()
        await sendOtpMail(user.email, otp)
        return res.status(200).json({ message: "otp sent successfully" })
    } catch (error) {
        return res.status(500).json(`send otp error ${error}`)
    }
}

export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body
        const normalizedEmail = normalizeEmail(email)
        const user = await User.findOne({ email: normalizedEmail })
        if (!user || user.resetOtp != otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "invalid/expired otp" })
        }
        user.isOtpVerified = true
        user.resetOtp = undefined
        user.otpExpires = undefined
        await user.save()
        return res.status(200).json({ message: "otp verify successfully" })
    } catch (error) {
        return res.status(500).json(`verify otp error ${error}`)
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body
        const normalizedEmail = normalizeEmail(email)
        const user = await User.findOne({ email: normalizedEmail })
        if (!user || !user.isOtpVerified) {
            return res.status(400).json({ message: "otp verification required" })
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        user.isOtpVerified = false
        await user.save()
        return res.status(200).json({ message: "password reset successfully" })
    } catch (error) {
        return res.status(500).json(`reset password error ${error}`)
    }
}

export const googleAuth = async (req, res) => {
    try {
        const { fullName, email, mobile, role, idToken } = req.body
        if (!idToken) {
            return res.status(400).json({ message: "google id token is required" })
        }

        const firebaseUser = await verifyFirebaseIdToken(idToken)
        const normalizedEmail = normalizeEmail(email)
        if (!firebaseUser || normalizeEmail(firebaseUser.email) !== normalizedEmail) {
            return res.status(401).json({ message: "google account verification failed" })
        }

        let user = await User.findOne({ email: normalizedEmail })
        if (!user) {
            if (!fullName || !mobile || !role) {
                return res.status(400).json({ message: "fullName, mobile and role are required for new google sign up" })
            }
            user = await User.create({
                fullName,
                email: normalizedEmail,
                loginId: normalizedEmail,
                mobile,
                role,
                isEmailVerified: true
            })
        } else if (!user.isEmailVerified) {
            user.isEmailVerified = true
            user.signupOtp = undefined
            user.signupOtpExpires = undefined
            await user.save()
        }

        const token = await genToken(user._id)
        res.cookie("token", token, getCookieOptions())

        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json(`googleAuth error ${error}`)
    }
}
