const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    category:{
        type:mongoose.Schema.ObjectId,
        ref:'Category',
        required:true,
    },
    brandName:{
        type:mongoose.Schema.ObjectId,
        ref:'Brand',
        required:true,
    },
    price:{
        type:Number,
        required:true,
    },
    qty:{
        type:Number,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    image:{
        type:Array,
        required:true,
    },
    is_active:{
        type:Boolean,
        default:true,
    },
    offer:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Offer',
    },
    categoryOffer:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'offer'
    },
    discountedPrice:{
        type:Number,
    },
    categoryDiscountedPrice:{
        type:Number,
    }
},{ timestamps: true });

//Export the model
module.exports = mongoose.model('Product', productSchema);