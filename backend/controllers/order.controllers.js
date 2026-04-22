import DeliveryAssignment from "../models/deliveryAssignment.model.js"
import Order from "../models/order.model.js"
import Shop from "../models/shop.model.js"
import User from "../models/user.model.js"
import RazorPay from "razorpay"
import dotenv from "dotenv"

dotenv.config()
let instance = new RazorPay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getAuthenticatedUser = async (req) => User.findById(req.userId)

const isOwnerOfShopOrder = (shopOrder, userId) => String(shopOrder.owner) === String(userId) || String(shopOrder.owner?._id) === String(userId)

const isAssignedDeliveryBoy = (shopOrder, userId) => String(shopOrder.assignedDeliveryBoy) === String(userId) || String(shopOrder.assignedDeliveryBoy?._id) === String(userId)

const canAccessOrder = (order, userId) => {
    if (String(order.user) === String(userId) || String(order.user?._id) === String(userId)) {
        return true
    }

    return order.shopOrders.some((shopOrder) => (
        isOwnerOfShopOrder(shopOrder, userId) || isAssignedDeliveryBoy(shopOrder, userId)
    ))
}

const formatDeliveryAssignment = (assignment) => {
    const shopOrder = assignment.order?.shopOrders?.find((so) => so._id.equals(assignment.shopOrderId))

    if (!assignment.order || !assignment.shop || !shopOrder) {
        return null
    }

    return {
        assignmentId: assignment._id,
        orderId: assignment.order._id,
        shopName: assignment.shop.name,
        deliveryAddress: assignment.order.deliveryAddress,
        items: shopOrder.shopOrderItems || [],
        subtotal: shopOrder.subtotal
    }
}

const estimateMinutesByStatus = {
    pending: 45,
    accepted: 35,
    preparing: 25,
    "out of delivery": 18,
    "picked up": 10
}

const updateEstimatedDeliveryTime = (shopOrder, status) => {
    const minutes = estimateMinutesByStatus[status]
    if (!minutes) {
        shopOrder.estimatedDeliveryTime = null
        return
    }

    shopOrder.estimatedDeliveryTime = new Date(Date.now() + minutes * 60 * 1000)
}

const buildShopOrderStatusPayload = (order, shopOrder) => ({
    orderId: order._id,
    shopId: shopOrder.shop?._id || shopOrder.shop,
    shopOrderId: shopOrder._id,
    status: shopOrder.status,
    assignedDeliveryBoy: shopOrder.assignedDeliveryBoy?._id ? {
        _id: shopOrder.assignedDeliveryBoy._id,
        fullName: shopOrder.assignedDeliveryBoy.fullName,
        mobile: shopOrder.assignedDeliveryBoy.mobile,
        location: shopOrder.assignedDeliveryBoy.location
    } : (shopOrder.assignedDeliveryBoy || null),
    estimatedDeliveryTime: shopOrder.estimatedDeliveryTime || null,
    cancelledAt: shopOrder.cancelledAt || null
})

const emitOrderStatusUpdate = (io, order, shopOrder) => {
    if (!io) {
        return
    }

    const payload = buildShopOrderStatusPayload(order, shopOrder)
    const roomIds = [String(order.user), String(shopOrder.owner)]

    if (shopOrder.assignedDeliveryBoy) {
        roomIds.push(String(shopOrder.assignedDeliveryBoy))
    }

    roomIds.forEach((roomId) => {
        io.to(`user:${roomId}`).emit("update-status", payload)
    })
}

export const placeOrder = async (req, res) => {
    try {
        const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body
        if (cartItems.length == 0 || !cartItems) {
            return res.status(400).json({ message: "cart is empty" })
        }
        if (!deliveryAddress.text || !deliveryAddress.latitude || !deliveryAddress.longitude) {
            return res.status(400).json({ message: "send complete deliveryAddress" })
        }

        const groupItemsByShop = {}

        cartItems.forEach(item => {
            const shopId = item.shop
            if (!groupItemsByShop[shopId]) {
                groupItemsByShop[shopId] = []
            }
            groupItemsByShop[shopId].push(item)
        });

        const shopOrders = await Promise.all(Object.keys(groupItemsByShop).map(async (shopId) => {
            const shop = await Shop.findById(shopId).populate("owner")
            if (!shop) {
                return res.status(400).json({ message: "shop not found" })
            }
            const items = groupItemsByShop[shopId]
            const subtotal = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0)
            return {
                shop: shop._id,
                owner: shop.owner._id,
                subtotal,
                estimatedDeliveryTime: new Date(Date.now() + estimateMinutesByStatus.pending * 60 * 1000),
                shopOrderItems: items.map((i) => ({
                    item: i.id,
                    price: i.price,
                    quantity: i.quantity,
                    name: i.name
                }))
            }
        }
        ))

        if (paymentMethod == "online") {
            const razorOrder = await instance.orders.create({
                amount: Math.round(totalAmount * 100),
                currency: 'INR',
                receipt: `receipt_${Date.now()}`
            })
            const newOrder = await Order.create({
                user: req.userId,
                paymentMethod,
                deliveryAddress,
                totalAmount,
                shopOrders,
                razorpayOrderId: razorOrder.id,
                payment: false
            })

            return res.status(200).json({
                razorOrder,
                orderId: newOrder._id,
            })

        }

        const newOrder = await Order.create({
            user: req.userId,
            paymentMethod,
            deliveryAddress,
            totalAmount,
            shopOrders
        })

        await newOrder.populate("shopOrders.shopOrderItems.item", "name image price")
        await newOrder.populate("shopOrders.shop", "name")
        await newOrder.populate("shopOrders.owner", "name socketId")
        await newOrder.populate("user", "name email mobile")

        const io = req.app.get('io')

        if (io) {
            newOrder.shopOrders.forEach(shopOrder => {
                const ownerSocketId = shopOrder.owner.socketId
                if (ownerSocketId) {
                    io.to(ownerSocketId).emit('newOrder', {
                        _id: newOrder._id,
                        paymentMethod: newOrder.paymentMethod,
                        user: newOrder.user,
                        shopOrders: shopOrder,
                        createdAt: newOrder.createdAt,
                        deliveryAddress: newOrder.deliveryAddress,
                        payment: newOrder.payment
                    })
                }
            });
        }



        return res.status(201).json(newOrder)
    } catch (error) {
        return res.status(500).json({ message: `place order error ${error}` })
    }
}

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, orderId } = req.body
        const order = await Order.findById(orderId)
        if (!order) {
            return res.status(400).json({ message: "order not found" })
        }
        if (String(order.user) !== String(req.userId)) {
            return res.status(403).json({ message: "you are not allowed to verify this order" })
        }

        const payment = await instance.payments.fetch(razorpay_payment_id)
        if (!payment || payment.status != "captured") {
            return res.status(400).json({ message: "payment not captured" })
        }
        if (payment.order_id !== order.razorpayOrderId) {
            return res.status(400).json({ message: "payment does not belong to this order" })
        }
        if (Number(payment.amount) !== Math.round(Number(order.totalAmount) * 100)) {
            return res.status(400).json({ message: "payment amount mismatch" })
        }

        order.payment = true
        order.razorpayPaymentId = razorpay_payment_id
        await order.save()

        await order.populate("shopOrders.shopOrderItems.item", "name image price")
        await order.populate("shopOrders.shop", "name")
        await order.populate("shopOrders.owner", "name socketId")
        await order.populate("user", "name email mobile")

        const io = req.app.get('io')

        if (io) {
            order.shopOrders.forEach(shopOrder => {
                const ownerSocketId = shopOrder.owner.socketId
                if (ownerSocketId) {
                    io.to(ownerSocketId).emit('newOrder', {
                        _id: order._id,
                        paymentMethod: order.paymentMethod,
                        user: order.user,
                        shopOrders: shopOrder,
                        createdAt: order.createdAt,
                        deliveryAddress: order.deliveryAddress,
                        payment: order.payment
                    })
                }
            });
        }


        return res.status(200).json(order)

    } catch (error) {
        return res.status(500).json({ message: `verify payment  error ${error}` })
    }
}



export const getMyOrders = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }
        if (user.role == "user") {
            const orders = await Order.find({ user: req.userId })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("shopOrders.owner", "name email mobile")
                .populate("shopOrders.assignedDeliveryBoy", "fullName email mobile location")
                .populate("shopOrders.shopOrderItems.item", "name image price")

            return res.status(200).json(orders)
        } else if (user.role == "owner") {
            const orders = await Order.find({ "shopOrders.owner": req.userId })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("user")
                .populate("shopOrders.shopOrderItems.item", "name image price")
                .populate("shopOrders.assignedDeliveryBoy", "fullName mobile location")



            const filteredOrders = orders.map((order => ({
                _id: order._id,
                paymentMethod: order.paymentMethod,
                user: order.user,
                shopOrders: order.shopOrders.find(o => o.owner._id == req.userId),
                createdAt: order.createdAt,
                deliveryAddress: order.deliveryAddress,
                payment: order.payment
            })))


            return res.status(200).json(filteredOrders)
        }

        return res.status(403).json({ message: "orders are not available for this role" })

    } catch (error) {
        return res.status(500).json({ message: `get User order error ${error}` })
    }
}


export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, shopId } = req.params
        const { status } = req.body
        const allowedOwnerStatuses = ["pending", "accepted", "preparing", "out of delivery"]
        const user = await getAuthenticatedUser(req)
        if (!user || user.role !== "owner") {
            return res.status(403).json({ message: "only shop owners can update order status" })
        }
        if (!allowedOwnerStatuses.includes(status)) {
            return res.status(400).json({ message: "invalid status update" })
        }

        const order = await Order.findById(orderId)
        if (!order) {
            return res.status(404).json({ message: "order not found" })
        }

        const shopOrder = order.shopOrders.find(o => o.shop == shopId)
        if (!shopOrder) {
            return res.status(400).json({ message: "shop order not found" })
        }
        if (!isOwnerOfShopOrder(shopOrder, req.userId)) {
            return res.status(403).json({ message: "you are not allowed to update this shop order" })
        }
        if (shopOrder.status === "cancelled" || shopOrder.status === "delivered") {
            return res.status(400).json({ message: "this order can no longer be updated" })
        }

        shopOrder.status = status
        if (status === "accepted" && !shopOrder.acceptedAt) {
            shopOrder.acceptedAt = new Date()
        }
        updateEstimatedDeliveryTime(shopOrder, status)
        let deliveryBoysPayload = []
        if (status == "out of delivery" && !shopOrder.assignment) {
            const { longitude, latitude } = order.deliveryAddress
            let candidateDeliveryBoys = await User.find({
                role: "deliveryBoy",
                location: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
                        $maxDistance: 5000
                    }
                }
            })

            // Fall back to all delivery boys when no nearby location is available yet.
            if (candidateDeliveryBoys.length === 0) {
                candidateDeliveryBoys = await User.find({
                    role: "deliveryBoy"
                })
            }

            const candidateIds = candidateDeliveryBoys.map(b => b._id)
            const busyIds = await DeliveryAssignment.find({
                assignedTo: { $in: candidateIds },
                status: { $nin: ["brodcasted", "completed"] }

            }).distinct("assignedTo")

            const busyIdSet = new Set(busyIds.map(id => String(id)))

            const availableBoys = candidateDeliveryBoys.filter(b => !busyIdSet.has(String(b._id)))
            const candidates = availableBoys.map(b => b._id)

            if (candidates.length == 0) {
                await order.save()
                return res.json({
                    message: "order status updated but there is no available delivery boys"
                })
            }

            const deliveryAssignment = await DeliveryAssignment.create({
                order: order?._id,
                shop: shopOrder.shop,
                shopOrderId: shopOrder?._id,
                brodcastedTo: candidates,
                status: "brodcasted"
            })

            shopOrder.assignedDeliveryBoy = deliveryAssignment.assignedTo
            shopOrder.assignment = deliveryAssignment._id
            deliveryBoysPayload = availableBoys.map(b => ({
                id: b._id,
                fullName: b.fullName,
                longitude: b.location.coordinates?.[0],
                latitude: b.location.coordinates?.[1],
                mobile: b.mobile
            }))

            await deliveryAssignment.populate('order')
            await deliveryAssignment.populate('shop')
            const io = req.app.get('io')
            if (io) {
                availableBoys.forEach(boy => {
                    const boySocketId = boy.socketId
                    if (boySocketId) {
                        io.to(boySocketId).emit('newAssignment', {
                            sentTo:boy._id,
                            assignmentId: deliveryAssignment._id,
                            orderId: deliveryAssignment.order._id,
                            shopName: deliveryAssignment.shop.name,
                            deliveryAddress: deliveryAssignment.order.deliveryAddress,
                            items: deliveryAssignment.order.shopOrders.find(so => so._id.equals(deliveryAssignment.shopOrderId)).shopOrderItems || [],
                            subtotal: deliveryAssignment.order.shopOrders.find(so => so._id.equals(deliveryAssignment.shopOrderId))?.subtotal
                        })
                    }
                });
            }





        }


        await order.save()
        const updatedShopOrder = order.shopOrders.find(o => o.shop == shopId)
        await order.populate("shopOrders.shop", "name")
        await order.populate("shopOrders.assignedDeliveryBoy", "fullName email mobile location")

        const io = req.app.get('io')
        emitOrderStatusUpdate(io, order, updatedShopOrder)



        return res.status(200).json({
            shopOrder: updatedShopOrder,
            assignedDeliveryBoy: updatedShopOrder?.assignedDeliveryBoy,
            availableBoys: deliveryBoysPayload,
            assignment: updatedShopOrder?.assignment?._id,
            estimatedDeliveryTime: updatedShopOrder?.estimatedDeliveryTime

        })



    } catch (error) {
        return res.status(500).json({ message: `order status error ${error}` })
    }
}


export const getDeliveryBoyAssignment = async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req)
        if (!user || user.role !== "deliveryBoy") {
            return res.status(403).json({ message: "only delivery boys can view assignments" })
        }

        const deliveryBoyId = req.userId
        const assignments = await DeliveryAssignment.find({
            brodcastedTo: { $in: [deliveryBoyId] },
            status: "brodcasted"
        })
            .populate("order")
            .populate("shop")

        let formated = assignments.map(formatDeliveryAssignment).filter(Boolean)

        if (formated.length === 0) {
            const fallbackOrders = await Order.find({
                "shopOrders.status": "out of delivery",
                "shopOrders.assignedDeliveryBoy": null
            }).populate("shopOrders.shop", "name")

            for (const order of fallbackOrders) {
                for (const shopOrder of order.shopOrders) {
                    if (shopOrder.status !== "out of delivery" || shopOrder.assignedDeliveryBoy) {
                        continue
                    }

                    let assignment = null

                    if (shopOrder.assignment) {
                        assignment = await DeliveryAssignment.findById(shopOrder.assignment)
                            .populate("order")
                            .populate("shop")
                    }

                    if (!assignment) {
                        assignment = await DeliveryAssignment.create({
                            order: order._id,
                            shop: shopOrder.shop?._id || shopOrder.shop,
                            shopOrderId: shopOrder._id,
                            brodcastedTo: [deliveryBoyId],
                            status: "brodcasted"
                        })

                        shopOrder.assignment = assignment._id
                        await order.save()

                        assignment = await DeliveryAssignment.findById(assignment._id)
                            .populate("order")
                            .populate("shop")
                    } else if (!assignment.brodcastedTo.some((id) => String(id) === String(deliveryBoyId))) {
                        assignment.brodcastedTo.push(deliveryBoyId)
                        await assignment.save()
                        assignment = await DeliveryAssignment.findById(assignment._id)
                            .populate("order")
                            .populate("shop")
                    }

                    const formattedAssignment = formatDeliveryAssignment(assignment)
                    if (formattedAssignment) {
                        formated.push(formattedAssignment)
                    }
                }
            }
        }

        return res.status(200).json(formated)
    } catch (error) {
        return res.status(500).json({ message: `get Assignment error ${error}` })
    }
}


export const acceptOrder = async (req, res) => {
    try {
        const { assignmentId } = req.params
        const user = await getAuthenticatedUser(req)
        if (!user || user.role !== "deliveryBoy") {
            return res.status(403).json({ message: "only delivery boys can accept assignments" })
        }

        const assignment = await DeliveryAssignment.findById(assignmentId)
        if (!assignment) {
            return res.status(400).json({ message: "assignment not found" })
        }
        if (assignment.status !== "brodcasted") {
            return res.status(400).json({ message: "assignment is expired" })
        }
        if (!assignment.brodcastedTo.some(id => String(id) === String(req.userId))) {
            return res.status(403).json({ message: "this assignment was not sent to you" })
        }

        const alreadyAssigned = await DeliveryAssignment.findOne({
            assignedTo: req.userId,
            status: { $nin: ["brodcasted", "completed"] }
        })

        if (alreadyAssigned) {
            return res.status(400).json({ message: "You are already assigned to another order" })
        }

        assignment.assignedTo = req.userId
        assignment.status = 'assigned'
        assignment.acceptedAt = new Date()
        await assignment.save()

        const order = await Order.findById(assignment.order)
        if (!order) {
            return res.status(400).json({ message: "order not found" })
        }

        let shopOrder = order.shopOrders.id(assignment.shopOrderId)
        shopOrder.assignedDeliveryBoy = req.userId
        await order.save()
        await order.populate("shopOrders.assignedDeliveryBoy", "fullName email mobile location")

        shopOrder = order.shopOrders.id(assignment.shopOrderId)
        emitOrderStatusUpdate(req.app.get("io"), order, shopOrder)


        return res.status(200).json({
            message: 'order accepted'
        })
    } catch (error) {
        return res.status(500).json({ message: `accept order error ${error}` })
    }
}



export const getCurrentOrder = async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req)
        if (!user || user.role !== "deliveryBoy") {
            return res.status(403).json({ message: "only delivery boys can view current order" })
        }

        const assignment = await DeliveryAssignment.findOne({
            assignedTo: req.userId,
            status: "assigned"
        })
            .populate("shop", "name")
            .populate("assignedTo", "fullName email mobile location")
            .populate({
                path: "order",
                populate: [
                    { path: "user", select: "fullName email location mobile" },
                    { path: "shopOrders.shop", select: "name" }
                ]

            })

        if (!assignment) {
            return res.status(400).json({ message: "assignment not found" })
        }
        if (!assignment.order) {
            return res.status(400).json({ message: "order not found" })
        }

        const shopOrder = assignment.order.shopOrders.find(so => String(so._id) == String(assignment.shopOrderId))

        if (!shopOrder) {
            return res.status(400).json({ message: "shopOrder not found" })
        }

        let deliveryBoyLocation = { lat: null, lon: null }
        if (assignment.assignedTo.location.coordinates.length == 2) {
            deliveryBoyLocation.lat = assignment.assignedTo.location.coordinates[1]
            deliveryBoyLocation.lon = assignment.assignedTo.location.coordinates[0]
        }

        let customerLocation = { lat: null, lon: null }
        if (assignment.order.deliveryAddress) {
            customerLocation.lat = assignment.order.deliveryAddress.latitude
            customerLocation.lon = assignment.order.deliveryAddress.longitude
        }

        return res.status(200).json({
            _id: assignment.order._id,
            user: assignment.order.user,
            shopOrder,
            deliveryAddress: assignment.order.deliveryAddress,
            deliveryBoyLocation,
            customerLocation
        })


    } catch (error) {
        return res.status(500).json({ message: `get current order error ${error}` })
    }
}

export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params
        const order = await Order.findById(orderId)
            .populate("user")
            .populate({
                path: "shopOrders.shop",
                model: "Shop"
            })
            .populate({
                path: "shopOrders.assignedDeliveryBoy",
                model: "User",
                select: "fullName email mobile location"
            })
            .populate({
                path: "shopOrders.shopOrderItems.item",
                model: "Item"
            })
            .lean()

        if (!order) {
            return res.status(400).json({ message: "order not found" })
        }
        if (!canAccessOrder(order, req.userId)) {
            return res.status(403).json({ message: "you are not allowed to access this order" })
        }
        return res.status(200).json(order)
    } catch (error) {
        return res.status(500).json({ message: `get by id order error ${error}` })
    }
}

export const cancelOrderByUser = async (req, res) => {
    try {
        const { orderId, shopOrderId } = req.params
        const user = await getAuthenticatedUser(req)
        if (!user || user.role !== "user") {
            return res.status(403).json({ message: "only users can cancel orders" })
        }

        const order = await Order.findById(orderId)
        if (!order) {
            return res.status(404).json({ message: "order not found" })
        }
        if (String(order.user) !== String(req.userId)) {
            return res.status(403).json({ message: "you are not allowed to cancel this order" })
        }

        const shopOrder = order.shopOrders.id(shopOrderId)
        if (!shopOrder) {
            return res.status(404).json({ message: "shop order not found" })
        }
        if (!["pending", "accepted", "preparing"].includes(shopOrder.status)) {
            return res.status(400).json({ message: "this order can no longer be cancelled" })
        }

        if (shopOrder.assignment) {
            await DeliveryAssignment.deleteOne({ _id: shopOrder.assignment })
        }

        shopOrder.status = "cancelled"
        shopOrder.cancelledAt = new Date()
        shopOrder.cancelledBy = "user"
        shopOrder.assignment = null
        shopOrder.assignedDeliveryBoy = null
        updateEstimatedDeliveryTime(shopOrder, "cancelled")
        await order.save()

        emitOrderStatusUpdate(req.app.get("io"), order, shopOrder)

        return res.status(200).json({
            message: "order cancelled successfully",
            shopOrder: buildShopOrderStatusPayload(order, shopOrder)
        })
    } catch (error) {
        return res.status(500).json({ message: `cancel order error ${error}` })
    }
}

export const pickupOrder = async (req, res) => {
    try {
        const { orderId, shopOrderId } = req.body
        const user = await getAuthenticatedUser(req)
        if (!user || user.role !== "deliveryBoy") {
            return res.status(403).json({ message: "only delivery boys can pick up orders" })
        }

        const order = await Order.findById(orderId)
        if (!order) {
            return res.status(404).json({ message: "order not found" })
        }

        const shopOrder = order.shopOrders.id(shopOrderId)
        if (!shopOrder) {
            return res.status(404).json({ message: "shop order not found" })
        }
        if (!isAssignedDeliveryBoy(shopOrder, req.userId)) {
            return res.status(403).json({ message: "you are not assigned to this order" })
        }
        if (shopOrder.status === "cancelled" || shopOrder.status === "delivered") {
            return res.status(400).json({ message: "this order can no longer be updated" })
        }

        shopOrder.status = "picked up"
        shopOrder.pickedUpAt = new Date()
        updateEstimatedDeliveryTime(shopOrder, "picked up")
        await order.save()
        await order.populate("shopOrders.assignedDeliveryBoy", "fullName email mobile location")

        emitOrderStatusUpdate(req.app.get("io"), order, order.shopOrders.id(shopOrderId))

        return res.status(200).json({
            message: "order picked up successfully",
            shopOrder: buildShopOrderStatusPayload(order, shopOrder)
        })
    } catch (error) {
        return res.status(500).json({ message: `pickup order error ${error}` })
    }
}

export const completeDelivery = async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req)
        if (!user || user.role !== "deliveryBoy") {
            return res.status(403).json({ message: "only delivery boys can complete delivery" })
        }

        const { orderId, shopOrderId } = req.body
        const order = await Order.findById(orderId).populate("user")
        if (!order) {
            return res.status(400).json({ message: "enter valid order/shopOrderid" })
        }
        const shopOrder = order.shopOrders.id(shopOrderId)
        if (!shopOrder) {
            return res.status(400).json({ message: "enter valid order/shopOrderid" })
        }
        if (!isAssignedDeliveryBoy(shopOrder, req.userId)) {
            return res.status(403).json({ message: "you are not assigned to this order" })
        }

        shopOrder.status = "delivered"
        shopOrder.deliveredAt = Date.now()
        shopOrder.deliveryOtp = null
        shopOrder.otpExpires = null
        updateEstimatedDeliveryTime(shopOrder, "delivered")
        await order.save()
        await order.populate("shopOrders.assignedDeliveryBoy", "fullName email mobile location")
        await DeliveryAssignment.deleteOne({
            shopOrderId: shopOrder._id,
            order: order._id,
            assignedTo: shopOrder.assignedDeliveryBoy
        })

        emitOrderStatusUpdate(req.app.get("io"), order, order.shopOrders.id(shopOrderId))

        return res.status(200).json({ message: "Order Delivered Successfully!" })

    } catch (error) {
        return res.status(500).json({ message: `complete delivery error ${error}` })
    }
}

export const getTodayDeliveries=async (req,res) => {
    try {
        const user = await getAuthenticatedUser(req)
        if (!user || user.role !== "deliveryBoy") {
            return res.status(403).json({ message: "only delivery boys can view delivery stats" })
        }

        const deliveryBoyId=req.userId
        const startsOfDay=new Date()
        startsOfDay.setHours(0,0,0,0)

        const orders=await Order.find({
           "shopOrders.assignedDeliveryBoy":deliveryBoyId,
           "shopOrders.status":"delivered",
           "shopOrders.deliveredAt":{$gte:startsOfDay}
        }).lean()

     let todaysDeliveries=[] 
     
     orders.forEach(order=>{
        order.shopOrders.forEach(shopOrder=>{
            if(shopOrder.assignedDeliveryBoy==deliveryBoyId &&
                shopOrder.status=="delivered" &&
                shopOrder.deliveredAt &&
                shopOrder.deliveredAt>=startsOfDay
            ){
                todaysDeliveries.push(shopOrder)
            }
        })
     })

let stats={}

todaysDeliveries.forEach(shopOrder=>{
    const hour=new Date(shopOrder.deliveredAt).getHours()
    stats[hour]=(stats[hour] || 0) + 1
})

let formattedStats=Object.keys(stats).map(hour=>({
 hour:parseInt(hour),
 count:stats[hour]   
}))

formattedStats.sort((a,b)=>a.hour-b.hour)

return res.status(200).json(formattedStats)
  

    } catch (error) {
        return res.status(500).json({ message: `today deliveries error ${error}` }) 
    }
}

export const getDeliveryBoyEarnings = async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req)
        if (!user || user.role !== "deliveryBoy") {
            return res.status(403).json({ message: "only delivery boys can view earnings" })
        }

        const deliveryBoyId = req.userId
        const orders = await Order.find({
            "shopOrders.assignedDeliveryBoy": deliveryBoyId,
            "shopOrders.status": "delivered"
        }).lean()

        let completedDeliveries = 0

        orders.forEach((order) => {
            order.shopOrders.forEach((shopOrder) => {
                if (
                    String(shopOrder.assignedDeliveryBoy) === String(deliveryBoyId) &&
                    shopOrder.status === "delivered"
                ) {
                    completedDeliveries += 1
                }
            })
        })

        return res.status(200).json({
            completedDeliveries,
            totalEarning: completedDeliveries * 50
        })
    } catch (error) {
        return res.status(500).json({ message: `delivery earnings error ${error}` })
    }
}



