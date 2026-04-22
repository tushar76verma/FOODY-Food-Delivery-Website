import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop"
    },
    category: {
        type: String,
        enum: ["Snacks",
            "Main Course",
            "Desserts",
            "Pizza",
            "Burgers",
            "Drinks",
            "Sandwiches",
            "South Indian",
            "North Indian",
            "Chinese",
            "Fast Food",
            "Drinks",
            "Others"
        ],
        required:true
    },
    price:{
        type:Number,
        min:0,
        required:true
    },
    foodType:{
        type:String,
        enum:["veg","non veg"],
        required:true
    },
   rating:{
    average:{type:Number,default:0},
    count:{type:Number,default:0}
   },
   reviews:[
    {
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        order:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Order"
        },
        shopOrderId:{
            type:mongoose.Schema.Types.ObjectId
        },
        rating:{
            type:Number,
            min:1,
            max:5
        },
        comment:{
            type:String,
            default:""
        },
        reviewedAt:{
            type:Date,
            default:Date.now
        }
    }
   ]
}, { timestamps: true })

const Item=mongoose.model("Item",itemSchema)
export default Item
