const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

    deliveryDetails:{
        type:String,
        required:true
    },  

    user:{
        type:mongoose.Types.ObjectId,
    },
    uniqueId:{
        type:Number
    },
    userId:{
        type:String,
        required:true,
    },
    userName:{
        type:String,
        required:true,
        
    },
    products:[
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                required:true,  
                ref:'Product'
            },
            quantity:{
                type:Number,
                default:1,

            },
            statusLevel:{
                type:Number,
                default:0
            },
            productPrice:{
                type:Number

            },
            totalPrice:{    
                type:Number
            },
            orderStatus:{
                type:String,
                require:true
            },
            paymentStatus:{
                type:String,
                require:true
            },  
            returnOrderStatus:{
                status:{
                    type:String
                },
                reason:{
                    type:String
                }
            },
            cancelOrderStatus:{
                status:{
                    type:String
                },
                reason:{
                    type:String
                }
            },

            updatedAt:{
                type:Date,
                default:Date.now
            },

        },
    ],

    deliveryDate:{
        type:Date
    },
    totalAmount:{
        type:Number,
        required:true
    },
    date:{
        type:Date
    },
    paymentMethod:{
        type:String
    },
    orderId:{
        type:String
    },
    paymentId:{
        type:String
    },
    discount:{
        type:String
    },
    expectedDelivery:{
        type:Date,
        required:true
    },
    couponDiscount:{
        type:Number
    }

},{timestamps:true});


module.exports = mongoose.model('Order',orderSchema);