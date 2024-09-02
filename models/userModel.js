const mongoose = require("mongoose");

//model to connect to the database

const userSchema = new mongoose.Schema({

    firstName: {
        type: String,
    },
    secondName: {
        type: String,
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
    },
    image: {
        type: String,
        required: false
    },
    password: {
        type: String,
    },
    is_admin: {
        type: Number,
        required: false
    },
    is_verified: {
        type: Number,
        default: 0
    },
    token: {
        type: String,
        default: ''
    },
    referralCode: {
        type: String,
        unique: true,
      
      },
    is_block: {
        type: Boolean,
        default: false
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    wallet:{
        type:Number,
        default:0
    },
    walletHistory:[{
        transactionDate:{
            type:Date
        },
        transactionDetails:{
            type:String
        },
        transactionType:{
            type:String
        },
        transactionAmount:{
            type:Number
        },
        currentBalance:{
            type:Number
        }
    }]
}, { timestamp: true });


module.exports = mongoose.model('user', userSchema);