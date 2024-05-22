const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,  
    },
    brandName:{
        type:String,
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
    }
});

//Export the model
module.exports = mongoose.model('Product', productSchema);