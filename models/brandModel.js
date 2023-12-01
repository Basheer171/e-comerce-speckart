const mongoose = require('mongoose');

const brandScheema = new mongoose.Schema({

    brandName:{
        type:String,
        required:true,
    },
    specification:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    is_block:{
        type:Boolean,
        default:false,
    }
},{timestamps:true});

module.exports=mongoose.model('Brand',brandScheema);