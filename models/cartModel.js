const mongoose = require('mongoose')

const cartSchema = mongoose.Schema({
    user:{
        type : mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },
    products :[{
        productId :{
            type:mongoose.Schema.Types.ObjectId,
            ref : "Product",
            required:true
        },
        quantity : {
            type : Number,
            default : 1
        },
        price:{
            type:Number,
            default:0
        },
        totalPrice: {
            type: Number,
            default: 0
        }
        
    }]
},
{timestamps:true})



module.exports = mongoose.model('Cart',cartSchema)