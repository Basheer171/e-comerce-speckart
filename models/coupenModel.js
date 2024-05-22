const mongoose = require('mongoose')

const couponScheema = new mongoose.Schema({
    couponName:{
        type:String,
        required:true,
    },
    couponCode:{
        type:String,
        required:true,
    },
    discountAmount:{
        type:Number,
        
    },
    validFrom:{
        type:Date,
        required:true,
    },
    validTo:{
        type:Date,
        required:true,
    },
    minimumSpend:{
        type: Number,
        required:true,
    },
    usedUsers:{
        type:Array,
        ref:'User',
        default:[],
    },
    usersLimit:{
        type:Number,
        required:true,
    },
    description:{
        type:String,
        required:false,
    },
    status:{
        type:Boolean,
        default:true,
    }
},{timestamps:true});

module.exports = mongoose.model('Coupon', couponScheema);