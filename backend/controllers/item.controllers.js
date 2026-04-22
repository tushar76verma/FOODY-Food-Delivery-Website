import Item from "../models/item.model.js";
import Order from "../models/order.model.js";
import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const refreshItemRating = async (itemId) => {
    const item = await Item.findById(itemId)
    if (!item) {
        return null
    }

    const reviews = item.reviews.filter((review) => review.rating)
    const count = reviews.length
    const average = count
        ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / count
        : 0

    item.rating.average = Number(average.toFixed(1))
    item.rating.count = count
    await item.save()

    return item
}

export const addItem = async (req, res) => {
    try {
        const { name, category, foodType, price } = req.body
        let image;
        if (req.file) {
            image = await uploadOnCloudinary(req.file.path)
        }
        const shop = await Shop.findOne({ owner: req.userId })
        if (!shop) {
            return res.status(400).json({ message: "shop not found" })
        }
        const item = await Item.create({
            name, category, foodType, price, image, shop: shop._id
        })

        shop.items.push(item._id)
        await shop.save()
        await shop.populate("owner")
        await shop.populate({
            path: "items",
            options: { sort: { updatedAt: -1 } }
        })
        return res.status(201).json(shop)

    } catch (error) {
        return res.status(500).json({ message: `add item error ${error}` })
    }
}

export const editItem = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const { name, category, foodType, price } = req.body
        let image;
        if (req.file) {
            image = await uploadOnCloudinary(req.file.path)
        }
        const item = await Item.findByIdAndUpdate(itemId, {
            name, category, foodType, price, image
        }, { new: true })
        if (!item) {
            return res.status(400).json({ message: "item not found" })
        }
        const shop = await Shop.findOne({ owner: req.userId }).populate({
            path: "items",
            options: { sort: { updatedAt: -1 } }
        })
        return res.status(200).json(shop)

    } catch (error) {
        return res.status(500).json({ message: `edit item error ${error}` })
    }
}

export const getItemById = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const item = await Item.findById(itemId)
        if (!item) {
            return res.status(400).json({ message: "item not found" })
        }
        return res.status(200).json(item)
    } catch (error) {
        return res.status(500).json({ message: `get item error ${error}` })
    }
}

export const deleteItem = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const item = await Item.findByIdAndDelete(itemId)
        if (!item) {
            return res.status(400).json({ message: "item not found" })
        }
        const shop = await Shop.findOne({ owner: req.userId })
        shop.items = shop.items.filter(i => i !== item._id)
        await shop.save()
        await shop.populate({
            path: "items",
            options: { sort: { updatedAt: -1 } }
        })
        return res.status(200).json(shop)

    } catch (error) {
        return res.status(500).json({ message: `delete item error ${error}` })
    }
}

export const getItemByCity = async (req, res) => {
    try {
        const { city } = req.params
        if (!city) {
            return res.status(400).json({ message: "city is required" })
        }
        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city}$`, "i") }
        }).populate('items')
        if (!shops) {
            return res.status(400).json({ message: "shops not found" })
        }
        const shopIds=shops.map((shop)=>shop._id)

        const items=await Item.find({shop:{$in:shopIds}})
        return res.status(200).json(items)

    } catch (error) {
 return res.status(500).json({ message: `get item by city error ${error}` })
    }
}

export const getItemsByShop=async (req,res) => {
    try {
        const {shopId}=req.params
        const shop=await Shop.findById(shopId).populate("items")
        if(!shop){
            return res.status(400).json("shop not found")
        }
        return res.status(200).json({
            shop,items:shop.items
        })
    } catch (error) {
         return res.status(500).json({ message: `get item by shop error ${error}` })
    }
}

export const searchItems=async (req,res) => {
    try {
        const {query,city}=req.query
        const trimmedQuery = (query || "").trim()
        if(!trimmedQuery){
            return res.status(200).json([])
        }

        const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const textRegexFilter = [
            { name: { $regex: escapedQuery, $options: "i" } },
            { category: { $regex: escapedQuery, $options: "i" } },
            { foodType: { $regex: escapedQuery, $options: "i" } }
        ]

        const cityFilter = city ? { city: { $regex: new RegExp(`^${city}$`, "i") } } : {}
        const cityScopedShops = await Shop.find(cityFilter).select("_id")
        const cityScopedShopIds = cityScopedShops.map((shop) => shop._id)

        const shopNameMatched = await Shop.find({
            ...cityFilter,
            name: { $regex: escapedQuery, $options: "i" }
        }).select("_id")
        const shopNameMatchedIds = shopNameMatched.map((shop) => shop._id)

        const searchFilter = {
            $or: [
                ...textRegexFilter,
                ...(shopNameMatchedIds.length ? [{ shop: { $in: shopNameMatchedIds } }] : [])
            ]
        }

        let scopedItems = []
        if (city) {
            if (cityScopedShopIds.length > 0) {
                scopedItems = await Item.find({
                    shop: { $in: cityScopedShopIds },
                    ...searchFilter
                }).populate("shop", "name image city")
            }

            if (scopedItems.length > 0) {
                return res.status(200).json(scopedItems)
            }
        }

        const items = await Item.find(searchFilter).populate("shop", "name image city")

        return res.status(200).json(items)

    } catch (error) {
         return res.status(500).json({ message: `search item  error ${error}` })
    }
}


export const rating=async (req,res) => {
    try {
        const {itemId,rating}=req.body

        if(!itemId || !rating){
            return res.status(400).json({message:"itemId and rating is required"})
        }

        if(rating<1 || rating>5){
             return res.status(400).json({message:"rating must be between 1 to 5"})
        }

        const item=await Item.findById(itemId)
        if(!item){
              return res.status(400).json({message:"item not found"})
        }

        item.reviews.push({
            user: req.userId,
            rating,
            comment: ""
        })
        await item.save()
        await refreshItemRating(itemId)
return res.status(200).json({rating:item.rating})

    } catch (error) {
         return res.status(500).json({ message: `rating error ${error}` })
    }
}

export const addReview = async (req, res) => {
    try {
        const { orderId, shopOrderId, itemId, rating, comment } = req.body

        if (!orderId || !shopOrderId || !itemId || !rating) {
            return res.status(400).json({ message: "orderId, shopOrderId, itemId and rating are required" })
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "rating must be between 1 to 5" })
        }

        const order = await Order.findById(orderId)
        if (!order) {
            return res.status(404).json({ message: "order not found" })
        }
        if (String(order.user) !== String(req.userId)) {
            return res.status(403).json({ message: "you are not allowed to review this order" })
        }

        const shopOrder = order.shopOrders.id(shopOrderId)
        if (!shopOrder) {
            return res.status(404).json({ message: "shop order not found" })
        }
        if (shopOrder.status !== "delivered") {
            return res.status(400).json({ message: "you can review only delivered items" })
        }

        const orderItem = shopOrder.shopOrderItems.find((item) => (
            String(item.item?._id || item.item) === String(itemId)
        ))
        if (!orderItem) {
            return res.status(404).json({ message: "item not found in this order" })
        }

        orderItem.review = {
            rating,
            comment: (comment || "").trim(),
            reviewedAt: new Date()
        }
        await order.save()

        const item = await Item.findById(itemId)
        if (!item) {
            return res.status(404).json({ message: "item not found" })
        }

        const existingReview = item.reviews.find((review) => (
            String(review.user) === String(req.userId)
            && String(review.order) === String(orderId)
            && String(review.shopOrderId) === String(shopOrderId)
        ))

        if (existingReview) {
            existingReview.rating = rating
            existingReview.comment = (comment || "").trim()
            existingReview.reviewedAt = new Date()
        } else {
            item.reviews.push({
                user: req.userId,
                order: orderId,
                shopOrderId,
                rating,
                comment: (comment || "").trim(),
                reviewedAt: new Date()
            })
        }

        await item.save()
        const updatedItem = await refreshItemRating(itemId)

        return res.status(200).json({
            message: "review submitted successfully",
            review: orderItem.review,
            rating: updatedItem?.rating || item.rating
        })
    } catch (error) {
        return res.status(500).json({ message: `review error ${error}` })
    }
}

export const getAllItems = async (req, res) => {
    try {
        const items = await Item.find({}).populate("shop", "name image city")
        return res.status(200).json(items)
    } catch (error) {
        return res.status(500).json({ message: `get all items error ${error}` })
    }
}
