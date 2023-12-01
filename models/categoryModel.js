const mongoose = require('mongoose');


const categorySchema = new mongoose.Schema({
    categoryName:{
        type:String,
        required:true,
    },
    description:{
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
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
    
},{timestamp:true});

module.exports=mongoose.model('Category',categorySchema);