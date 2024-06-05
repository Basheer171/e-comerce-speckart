  const userDb = require('../models/userModel')
  const addressDb = require('../models/addressModel');
  const addressModel = require('../models/addressModel');
  const cartDb = require('../models/cartModel');
  const productDb = require('../models/productModel');
  const orderDb  = require ('../models/orderModels')
  const Razorpay = require("razorpay");
  const crypto = require('crypto');


  var razorpayInstance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret
  });



  const loadCheckout = async (req, res)=>{
  try {
      
      const userId = req.session.user_id;
    
      const addressData = await addressModel.findOne({userId:userId})   
      const cartData = await cartDb.findOne({ user: userId }).populate("products.productId");

          if (req.session.user_id) {
              if (cartData && cartData.products.length > 0) {
                  
                  const Total = cartData.products.reduce((acc, product) => {
                      return acc + product.price * product.quantity;
                  }, 0);

                  res.render('checkout', { user: userId, address : addressData, cart: cartData, Total });
              } else {
                  res.render('checkout', { user: userId, address : addressData, cart: [], Total: 0 });
              }
          } else {
              res.redirect('/login'); // Redirect to a login page
          }

  } catch (error) {
      console.log(error);
  }
  }


  const editAddressLoad = async (req, res) => {
      try {
          const userId = req.session.user_id;
          const addressId = req.query.id;

          const user = await addressDb.findOne({ userId });
          const addressEdit = user.address.id(addressId);

          res.render('editAddress', { user, address: addressEdit });
      } catch (error) {
          console.log(error);
      }
  };

  const deleteAddress = async (req, res) => {
      const userId = req.session.user_id; 
      const addressId = req.body.id; 
    
      try {
        const user = await addressModel.findOne({ userId});   
    
        const addressIndex = user.address.id(addressId);
    
        if (addressIndex !== -1) {
    
          user.address.splice(addressIndex);
    
          await user.save();
    
          return res.json({ remove: 1 });
        } else {
          // Address not found
          return res.status(404).json({ error: 'Address not found' });
        }
      } catch (error) {
        console.error('Error deleting address:', error);
        // Respond with an error message
        res.status(500).json({ error: 'Internal Server Error' });
      }
    };

    const shipaddAddress = async (req, res, next) => {
      try {
        
        const  userAddress = await addressModel.findOne({userId : req.session.user_id})
    
        let userAddresscreat;
    
        if(!userAddress){
    
            userAddresscreat = new addressModel ({
    
            userId : req.session.user_id,
            address:[
              {
                fullName : req.body.fullName,
                mobile   : req.body.mobile,
                  state  : req.body.state,
                district:req.body.district,
                  city   : req.body.city,
                  pincode: req.body.pincode
            }]
    
          })
    
        }else {
    
          userAddresscreat = userAddress
    
          userAddresscreat.address.push({
            fullName : req.body.fullName,
            mobile   : req.body.mobile,
              state  : req.body.state,
            district:req.body.district,
              city   : req.body.city,
              pincode: req.body.pincode
          })
        }
    
        const result = userAddresscreat.save();
    
        res.redirect('/checkout')
    
      } catch (error) {
        console.log(error);
        // Handle the error appropriately, you might want to send an error response or call the 'next' middleware
        res.status(500).json({ error: 'Internal Server Error' });
      }
    };
    
    const placeOrder = async (req, res) => {
      try {
          const userId = req.session.user_id;
          const address = req.body.address;
          const cartData = await cartDb.findOne({ user: userId });
          const total = parseInt(req.body.totalAmount);
          const paymentMethod = req.body.paymentMethod;
          const userData = await userDb.findOne({ _id: userId });
          const name = userData.firstName;

          const uniNum = Math.floor(Math.random() * 900000) + 100000;
          const status = paymentMethod === 'COD' ? 'placed' : 'pending';

          const today = new Date();
          const deliveryDate = new Date(today);
          deliveryDate.setDate(today.getDate() + 7);

          const cartProducts = cartData.products.map((productItem) => ({
              productId: productItem.productId,
              quantity: productItem.quantity,
              orderStatus: 'Placed',
              statusLevel: 1,
              paymentStatus: 'Pending',
          }));

          const order = new orderDb({
              deliveryDetails: address,
              uniqueId: uniNum,
              userId: userId,
              userName: name,
              paymentMethod: paymentMethod,
              products: cartProducts,
              totalAmount: total,
              date: new Date(),
              expectedDelivery: deliveryDate,
          });

          const orderData = await order.save();
          const orderid = order._id;
          // console.log(orderid)
          if (orderData) {
              if (paymentMethod === 'COD') {
                  for (const item of cartData.products) {
                      const productId = item.productId._id;
                      const quantity = parseInt(item.quantity, 10);
                      await productDb.updateOne(
                          { _id: productId },
                          { $inc: { qty: -quantity } }
                      );
                  }
                  await cartDb.deleteOne({ user: req.session.user_id });
                  res.json({ success: true, orderid });
              } else {
                  const razorpayOrder = await razorpayInstance.orders.create({
                      amount: total * 100, // Amount in paise
                      currency: 'INR',
                      receipt: `order_rcptid_${orderid}`
                  });
                  res.json({ order: razorpayOrder, orderid });
              }
          } else {
              res.status(400).send('Failed to place the order');
          }
      } catch (error) {
          console.log(error);
          res.status(500).send('Internal Server Error');
      }
  };

  const verifyPayment = async (req, res) => {
    try {
      const details = req.body;
      console.log("details",details);
      const cartData = await cartDb.findOne({ user: req.session.user_id });
      const products = cartData.products;
  
      const hmac = crypto.createHmac('sha256', process.env.KEY_SECRET);
      hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id);
      const hmacValue = hmac.digest('hex');
  
      if (hmacValue === details.payment.razorpay_signature) {
        // Find the order using the actual ObjectId, not the receipt string
        const orderId = details.order.receipt.split('_')[2]; // Extract the ObjectId part from the receipt string
        const order = await orderDb.findById(orderId);
  
        if (!order) {
          return res.status(404).json({ message: 'Order not found' });
        }
  
        for (const item of products) {
          const productId = item.productId;
          const quantity = item.quantity;
  
          const updatedQty = await productDb.findOneAndUpdate(
            { _id: productId, qty: { $gte: quantity } },
            { $inc: { qty: -quantity } }
          );
  
          if (!updatedQty) {
            return res.status(400).json({ error: 'Insufficient product quantity' });
          }
        }
  
        await orderDb.findByIdAndUpdate(orderId, { $set: { 'products.$[].paymentStatus': 'success', paymentId: details.payment.razorpay_payment_id } });
        await cartDb.deleteOne({ user: req.session.user_id });
        res.json({ codsuccess: true, orderid: orderId });
      } else {
        res.status(400).json({ message: 'Invalid signature' });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).send('Internal Server Error');
    }
  };
  

  const  loadPlaceOrder = async (req, res)=>{
    try {

      const id  = req.session.user_id;
      // console.log('id',id);
      const userData = await userDb.findOne({_id:id})
      // console.log('userData',userData);

      res.render('orderPlace',{user: userData})
      
    } catch (error) {
      

      console.log(error);

    }
  }



  const loadOrderPage = async (req, res) => {
    try {
      const userId = req.session.user_id; 

      const orderData = await orderDb.find({ userId: userId }).sort({ date: -1 });

      const userData = await userDb.findById(userId);

      res.render('orders', { user: userData, orderData });
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
    }
  };


  //=================== load order detail page =============

  const loadOrderDeatail = async (req, res)=>{
    try {
      
      const id = req.query.id;
      const userid = req.session.user_id;
      const userData = await userDb.findOne({_id: userid})
  // console.log('userData',userData);
  const orderData = await orderDb.findOne({_id:id}).populate("products.productId")
  // console.log('orderDat',orderData);
  res.render('orderDetails',{user:userData, orders:orderData})
    } catch (error) {
      
      console.log(error);

    }
  }

  //======================= cancelorder =======================
  const cancelOrder = async (req, res) => {
    try {
        const { uniqueId, productId } = req.body;

        const orderData = await orderDb.findOne({ _id: uniqueId });

        if (!orderData) {
            return res.status(404).json({ message: "Order not found" });
        }

        const productInfo = orderData.products.find(
            (product) => product.productId.toString() === productId
        );

        if (!productInfo) {
            return res.status(404).json({ message: "Product not found in the order" });
        }

        // Check if the order status is "Delivered"
        if (productInfo.orderStatus === 'Delivered') {
            return res.status(400).json({ message: "Cannot cancel a delivered order" });
        }

        productInfo.orderStatus = "Cancelled";
        await orderData.save();

        const quantityToIncrease = productInfo.quantity;
        const product = await productDb.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found in the database" });
        }

        product.qty += quantityToIncrease;
        await product.save();

        res.json({ cancel: 1 });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
  };




  module.exports = {
      loadCheckout,
      editAddressLoad,
      deleteAddress,
      shipaddAddress,
      placeOrder,
      verifyPayment,
      loadPlaceOrder,
      loadOrderPage,
      loadOrderDeatail,
      cancelOrder
  }