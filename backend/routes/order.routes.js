import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { acceptOrder, cancelOrderByUser, completeDelivery, getCurrentOrder, getDeliveryBoyAssignment, getDeliveryBoyEarnings, getMyOrders, getOrderById, getTodayDeliveries, pickupOrder, placeOrder, updateOrderStatus, verifyPayment } from "../controllers/order.controllers.js"




const orderRouter=express.Router()

orderRouter.post("/place-order",isAuth,placeOrder)
orderRouter.post("/verify-payment",isAuth,verifyPayment)
orderRouter.get("/my-orders",isAuth,getMyOrders)
orderRouter.get("/get-assignments",isAuth,getDeliveryBoyAssignment)
orderRouter.get("/get-current-order",isAuth,getCurrentOrder)
orderRouter.post("/complete-delivery",isAuth,completeDelivery)
orderRouter.post("/pickup-order",isAuth,pickupOrder)
orderRouter.post("/update-status/:orderId/:shopId",isAuth,updateOrderStatus)
orderRouter.post("/cancel-order/:orderId/:shopOrderId",isAuth,cancelOrderByUser)
orderRouter.get('/accept-order/:assignmentId',isAuth,acceptOrder)
orderRouter.get('/get-order-by-id/:orderId',isAuth,getOrderById)
orderRouter.get('/get-today-deliveries',isAuth,getTodayDeliveries)
orderRouter.get('/get-delivery-earnings',isAuth,getDeliveryBoyEarnings)

export default orderRouter
