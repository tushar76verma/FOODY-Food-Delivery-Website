import axios from 'axios'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { serverUrl } from '../App'
import { useDispatch } from 'react-redux'
import { updateItemReviewInLists } from '../redux/userSlice'

function UserOrderCard({ data }) {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [selectedRating, setSelectedRating] = useState({})
    const [reviewInputs, setReviewInputs] = useState({})
    const [submittedReviews, setSubmittedReviews] = useState({})
    const [cancellingOrderId, setCancellingOrderId] = useState("")
    const [reviewSubmittingKey, setReviewSubmittingKey] = useState("")

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleString('en-GB', {
            day: "2-digit",
            month: "short",
            year: "numeric"
        })
    }

    const formatEstimatedTime = (dateString) => {
        if (!dateString) {
            return "Updating"
        }

        return new Date(dateString).toLocaleTimeString('en-GB', {
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const canCancelOrder = (status) => ["pending", "accepted", "preparing"].includes(status)

    const getReviewKey = (shopOrderId, itemId) => `${shopOrderId}_${itemId}`

    const handleSelectRating = (shopOrderId, itemId, rating) => {
        const reviewKey = getReviewKey(shopOrderId, itemId)
        setSelectedRating(prev => ({
            ...prev,
            [reviewKey]: rating
        }))
    }

    const handleReview = async (orderId, shopOrderId, itemId) => {
        try {
            const reviewKey = getReviewKey(shopOrderId, itemId)
            const rating = selectedRating[reviewKey] || 0
            if (!rating) {
                return
            }

            setReviewSubmittingKey(reviewKey)
            const result = await axios.post(`${serverUrl}/api/item/review`, {
                orderId,
                shopOrderId,
                itemId,
                rating,
                comment: reviewInputs[reviewKey] || ""
            }, { withCredentials: true })
            console.log(result.data)
            setSelectedRating(prev => ({
                ...prev, [reviewKey]: rating
            }))
            setReviewInputs(prev => ({
                ...prev,
                [reviewKey]: ""
            }))
            setSubmittedReviews(prev => ({
                ...prev,
                [reviewKey]: {
                    rating,
                    comment: result.data.review?.comment || reviewInputs[reviewKey] || ""
                }
            }))
            dispatch(updateItemReviewInLists({
                itemId,
                review: {
                    order: orderId,
                    shopOrderId,
                    rating,
                    comment: result.data.review?.comment || reviewInputs[reviewKey] || "",
                    reviewedAt: result.data.review?.reviewedAt || new Date().toISOString()
                },
                rating: result.data.rating
            }))
        } catch (error) {
            console.log(error)
        } finally {
            setReviewSubmittingKey("")
        }
    }

    const handleCancelOrder = async (orderId, shopOrderId) => {
        try {
            setCancellingOrderId(shopOrderId)
            const result = await axios.post(`${serverUrl}/api/order/cancel-order/${orderId}/${shopOrderId}`, {}, { withCredentials: true })
            console.log(result.data)
            window.location.reload()
        } catch (error) {
            console.log(error)
        } finally {
            setCancellingOrderId("")
        }
    }

    return (
        <div className='bg-white rounded-lg shadow p-4 space-y-4'>
            <div className='flex justify-between border-b pb-2'>
                <div>
                    <p className='font-semibold'>
                        order #{data._id.slice(-6)}
                    </p>
                    <p className='text-sm text-gray-500'>
                        Date: {formatDate(data.createdAt)}
                    </p>
                </div>
                <div className='text-right'>
                    {data.paymentMethod == "cod" ? <p className='text-sm text-gray-500'>{data.paymentMethod?.toUpperCase()}</p> : <p className='text-sm text-gray-500 font-semibold'>Payment: {data.payment ? "true" : "false"}</p>}

                    <p className='font-medium text-blue-600'>{data.shopOrders?.[0].status}</p>
                </div>
            </div>

            {data.shopOrders.map((shopOrder, index) => (
                <div className='border rounded-lg p-3 bg-[#fffaf7] space-y-3' key={index}>
                    <p>{shopOrder.shop.name}</p>
                    <p className='text-xs text-gray-500'>
                        Estimated delivery:
                        <span className='font-semibold text-gray-700'> {shopOrder.estimatedDeliveryTime ? formatEstimatedTime(shopOrder.estimatedDeliveryTime) : (shopOrder.status === "delivered" ? " Completed" : shopOrder.status === "cancelled" ? " Cancelled" : " Updating")}</span>
                    </p>

                    <div className='flex space-x-4 overflow-x-auto pb-2'>
                        {shopOrder.shopOrderItems.map((item, itemIndex) => (
                            <div key={itemIndex} className='flex-shrink-0 w-40 border rounded-lg p-2 bg-white"'>
                                <img src={item.item.image} alt="" className='w-full h-24 object-cover rounded' />
                                <p className='text-sm font-semibold mt-1'>{item.name}</p>
                                <p className='text-xs text-gray-500'>Qty: {item.quantity} x Rs. {item.price}</p>

                                {shopOrder.status == "delivered" && <>
                                    <div className='flex space-x-1 mt-2'>
                                        {[1, 2, 3, 4, 5].map((star) => {
                                            const reviewKey = getReviewKey(shopOrder._id, item.item._id)
                                            const activeRating = selectedRating[reviewKey] || item.review?.rating || 0

                                            return (
                                                <button className={`text-lg ${activeRating >= star ? 'text-yellow-400' : 'text-gray-400'}`} onClick={() => handleSelectRating(shopOrder._id, item.item._id, star)} key={star}>*</button>
                                            )
                                        })}
                                    </div>
                                    <textarea
                                        className='mt-2 w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none'
                                        placeholder='Write your review'
                                        value={reviewInputs[getReviewKey(shopOrder._id, item.item._id)] ?? item.review?.comment ?? ""}
                                        onChange={(e) => setReviewInputs(prev => ({
                                            ...prev,
                                            [getReviewKey(shopOrder._id, item.item._id)]: e.target.value
                                        }))}
                                    />
                                    <button
                                        className='mt-2 w-full rounded bg-orange-500 px-2 py-1 text-xs text-white hover:bg-orange-600'
                                        onClick={() => handleReview(data._id, shopOrder._id, item.item._id)}
                                        disabled={reviewSubmittingKey === getReviewKey(shopOrder._id, item.item._id) || !(selectedRating[getReviewKey(shopOrder._id, item.item._id)] || item.review?.rating)}
                                    >
                                        {reviewSubmittingKey === getReviewKey(shopOrder._id, item.item._id) ? "Submitting..." : "Submit Review"}
                                    </button>
                                    {(submittedReviews[getReviewKey(shopOrder._id, item.item._id)]?.comment || item.review?.comment) && (
                                        <div className='mt-2 rounded border border-orange-200 bg-orange-50 p-2 text-xs text-gray-700'>
                                            <p className='font-semibold text-orange-600'>Your Review</p>
                                            <p>{submittedReviews[getReviewKey(shopOrder._id, item.item._id)]?.comment || item.review?.comment}</p>
                                        </div>
                                    )}
                                </>}
                            </div>
                        ))}
                    </div>
                    <div className='flex justify-between items-center border-t pt-2'>
                        <p className='font-semibold'>Subtotal: {shopOrder.subtotal}</p>
                        <span className='text-sm font-medium text-blue-600'>{shopOrder.status}</span>
                    </div>
                    {canCancelOrder(shopOrder.status) && (
                        <button
                            className='rounded-lg bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600'
                            onClick={() => handleCancelOrder(data._id, shopOrder._id)}
                            disabled={cancellingOrderId === shopOrder._id}
                        >
                            {cancellingOrderId === shopOrder._id ? "Cancelling..." : "Cancel Order"}
                        </button>
                    )}
                </div>
            ))}

            <div className='flex justify-between items-center border-t pt-2'>
                <p className='font-semibold'>Total: Rs. {data.totalAmount}</p>
                <button className='bg-[#ff4d2d] hover:bg-[#e64526] text-white px-4 py-2 rounded-lg text-sm' onClick={() => navigate(`/track-order/${data._id}`)}>Track Order</button>
            </div>
        </div>
    )
}

export default UserOrderCard
