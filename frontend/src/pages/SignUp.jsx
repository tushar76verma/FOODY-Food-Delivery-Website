import React, { useState } from 'react'
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from 'react-router-dom';
import axios from "axios"
import { serverUrl } from '../App';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase';
import { ClipLoader } from "react-spinners"
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';

function SignUp() {
    const primaryColor = "#009C8E";
    const bgColor = "#F5F5F5";
    const borderColor = "#E5E7EB";
    const [showPassword, setShowPassword] = useState(false)
    const [role, setRole] = useState("user")
    const navigate = useNavigate()
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [mobile, setMobile] = useState("")
    const [otp, setOtp] = useState("")
    const [otpSent, setOtpSent] = useState(false)
    const [err, setErr] = useState("")
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const dispatch = useDispatch()

    const handleSendSignupOtp = async () => {
        setLoading(true)
        setErr("")
        setMessage("")
        try {
            const { data } = await axios.post(`${serverUrl}/api/auth/send-signup-otp`, {
                fullName, email, password, mobile, role
            }, { withCredentials: true })
            setOtpSent(true)
            setMessage(data.message)
        } catch (error) {
            setErr(error?.response?.data?.message || "unable to send otp")
        } finally {
            setLoading(false)
        }
    }

    const handleVerifySignupOtp = async () => {
        setLoading(true)
        setErr("")
        setMessage("")
        try {
            const result = await axios.post(`${serverUrl}/api/auth/verify-signup-otp`, {
                email, otp
            }, { withCredentials: true })
            dispatch(setUserData(result.data))
        } catch (error) {
            setErr(error?.response?.data?.message || "unable to verify otp")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleAuth = async () => {
        if (!mobile) {
            return setErr("mobile no is required")
        }
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(auth, provider)
        const idToken = await result.user.getIdToken()
        try {
            const { data } = await axios.post(`${serverUrl}/api/auth/google-auth`, {
                fullName: result.user.displayName,
                email: result.user.email,
                role,
                mobile,
                idToken
            }, { withCredentials: true })
            dispatch(setUserData(data))
        } catch (error) {
            setErr(error?.response?.data?.message || "google sign up failed")
        }
    }

    return (
        <div className='min-h-screen w-full flex items-center justify-center p-4' style={{ backgroundColor: bgColor }}>
            <div className='bg-white rounded-xl shadow-lg w-full max-w-md p-8 border-[1px]' style={{ border: `1px solid ${borderColor}` }}>
                <h1 className='text-3xl font-bold mb-2' style={{ color: primaryColor }}>Foody</h1>
                <p className='text-gray-600 mb-8'>Create your account with a real email id and verify it with OTP</p>

                <div className='mb-4'>
                    <label htmlFor="fullName" className='block text-gray-700 font-medium mb-1'>Full Name</label>
                    <input type="text" className='w-full border rounded-lg px-3 py-2 focus:outline-none' placeholder='Enter your Full Name' style={{ border: `1px solid ${borderColor}` }} onChange={(e) => setFullName(e.target.value)} value={fullName} required />
                </div>

                <div className='mb-4'>
                    <label htmlFor="email" className='block text-gray-700 font-medium mb-1'>Email</label>
                    <input type="email" className='w-full border rounded-lg px-3 py-2 focus:outline-none' placeholder='Enter your real email id' style={{ border: `1px solid ${borderColor}` }} onChange={(e) => setEmail(e.target.value)} value={email} required />
                </div>

                <div className='mb-4'>
                    <label htmlFor="mobile" className='block text-gray-700 font-medium mb-1'>Mobile</label>
                    <input type="tel" className='w-full border rounded-lg px-3 py-2 focus:outline-none' placeholder='Enter your Mobile Number' style={{ border: `1px solid ${borderColor}` }} onChange={(e) => setMobile(e.target.value)} value={mobile} required />
                </div>

                <div className='mb-4'>
                    <label htmlFor="password" className='block text-gray-700 font-medium mb-1'>Password</label>
                    <div className='relative'>
                        <input type={`${showPassword ? "text" : "password"}`} className='w-full border rounded-lg px-3 py-2 focus:outline-none pr-10' placeholder='Enter your password' style={{ border: `1px solid ${borderColor}` }} onChange={(e) => setPassword(e.target.value)} value={password} required />
                        <button className='absolute right-3 cursor-pointer top-[14px] text-gray-500' onClick={() => setShowPassword(prev => !prev)} type="button">{!showPassword ? <FaRegEye /> : <FaRegEyeSlash />}</button>
                    </div>
                </div>

                <div className='mb-4'>
                    <label htmlFor="role" className='block text-gray-700 font-medium mb-1'>Role</label>
                    <div className='flex gap-2'>
                        {["user", "owner", "deliveryBoy"].map((r) => (
                            <button
                                key={r}
                                className='flex-1 border rounded-lg px-3 py-2 text-center font-medium transition-colors cursor-pointer'
                                onClick={() => setRole(r)}
                                type="button"
                                style={role == r ? { backgroundColor: primaryColor, color: "white" } : { border: `1px solid ${primaryColor}`, color: primaryColor }}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {otpSent && (
                    <div className='mb-4'>
                        <label htmlFor="otp" className='block text-gray-700 font-medium mb-1'>OTP</label>
                        <input type="text" className='w-full border rounded-lg px-3 py-2 focus:outline-none' placeholder='Enter OTP sent to your email' style={{ border: `1px solid ${borderColor}` }} onChange={(e) => setOtp(e.target.value)} value={otp} />
                    </div>
                )}

                {!otpSent ? (
                    <button className='w-full font-semibold py-2 rounded-lg transition duration-200 bg-[var(--teal-dark)] text-white hover:bg-[var(--teal-primary)] cursor-pointer' onClick={handleSendSignupOtp} disabled={loading}>
                        {loading ? <ClipLoader size={20} color='white' /> : "Send OTP"}
                    </button>
                ) : (
                    <button className='w-full font-semibold py-2 rounded-lg transition duration-200 bg-[var(--teal-dark)] text-white hover:bg-[var(--teal-primary)] cursor-pointer' onClick={handleVerifySignupOtp} disabled={loading}>
                        {loading ? <ClipLoader size={20} color='white' /> : "Verify OTP & Sign Up"}
                    </button>
                )}

                {message && <p className='text-green-600 text-center my-[10px]'>{message}</p>}
                {err && <p className='text-red-500 text-center my-[10px]'>*{err}</p>}

                {otpSent && (
                    <button className='w-full mt-3 border rounded-lg px-4 py-2 transition cursor-pointer duration-200 border-gray-400 hover:bg-gray-100' onClick={handleSendSignupOtp} type="button">
                        Resend OTP
                    </button>
                )}

                <button className='w-full mt-4 flex items-center justify-center gap-2 border rounded-lg px-4 py-2 transition cursor-pointer duration-200 border-gray-400 hover:bg-gray-100' onClick={handleGoogleAuth} type="button">
                    <FcGoogle size={20} />
                    <span>Sign up with Google</span>
                </button>
                <p className='text-center mt-6 cursor-pointer' onClick={() => navigate("/signin")}>Already have an account ? <span className='text-[var(--teal-dark)]'>Sign In</span></p>
            </div>
        </div>
    )
}

export default SignUp
