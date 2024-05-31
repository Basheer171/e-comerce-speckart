const mongoose = require('mongoose');

const offerScheema = new mongoose.Schema({
    offerName:{
        type:String,
        required:true
    },
    startingDate:{
        type:Date,
        required:true
    },
    expiryDate:{
        type:Date,
        required:true
    },
    percentage:{
        type:Number,
        required:true
    },
    status:{
        type:Boolean,
        default:true
    }
},{timestamps:true});


module.exports = mongoose.model('Offer', offerScheema);