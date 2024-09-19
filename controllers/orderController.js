const mongoose = require('mongoose');

  const userDb = require('../models/userModel')

  const addressDb = require('../models/addressModel');
  const addressModel = require('../models/addressModel');
  const cartDb = require('../models/cartModel');
  const productDb = require('../models/productModel');
  const orderDb  = require ('../models/orderModels')
  const couponDb = require('../models/coupenModel')
  const Razorpay = require("razorpay");
  const crypto = require('crypto');
const { log } = require('console');


  var razorpayInstance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret
  });



  const loadCheckout = async (req, res)=>{
  try {
      
      const userId = req.session.user_id;
      const userData = await userDb.findOne({_id:userId});


      const wallet = userData.wallet;

      const addressData = await addressModel.findOne({userId:userId})   
      const cartData = await cartDb.findOne({ user: userId }).populate("products.productId");

          if (req.session.user_id) {
              if (cartData && cartData.products.length > 0) {
                  
                  const Total = cartData.products.reduce((acc, product) => {
                      return acc + product.price * product.quantity;
                  }, 0);

                  res.render('checkout', { user: userId, address : addressData, cart: cartData, Total, wallet });
              } else {
                  res.render('checkout', { user: userId, address : addressData, cart: [], Total: 0, wallet });
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
          const total = parseInt(req.body.totalAmount, 10);
          const couponDiscount = parseInt(req.body.totalAmount1, 10);
  
          const paymentMethod = req.body.paymentMethod;
          const userData = await userDb.findOne({ _id: userId });
          const name = userData.firstName;
          const walletBalance = userData.wallet;
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
              totalPrice: productItem.quantity * productItem.price,
              productPrice: productItem.price,
              paymentStatus: 'Pending',
              'returnOrderStatus.status': 'none',
              'returnOrderStatus.reason': 'none',
          }));
  
          let discountAmount = 0;
          if (req.session.code) {
              const coupon = await couponDb.findOne({ couponCode: req.session.code });
              if (coupon) {
                  discountAmount = coupon.discountAmount;
                  await couponDb.updateOne(
                      { couponCode: req.session.code },
                      { $inc: { usersLimit: -1 }, $push: { usedUsers: userId } }
                  );
              }
          }
  
          const finalAmount = total - discountAmount;
  
          // Wallet validation
          if (paymentMethod === 'wallet' && walletBalance < finalAmount) {
              return res.json({ walletFailed: true });
          }
  
          const order = new orderDb({
              deliveryDetails: address,
              uniqueId: uniNum,
              userId: userId,
              userName: name,
              paymentMethod: paymentMethod,
              products: cartProducts,
              totalAmount: finalAmount,
              date: new Date(),
              expectedDelivery: deliveryDate,
              discount: discountAmount,
              couponDiscount: couponDiscount
          });
  
          const orderData = await order.save();
          const orderid = order._id;
  
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
              return res.json({ success: true, orderid });
          } else if (paymentMethod === 'online') {
              const razorpayOrder = await razorpayInstance.orders.create({
                  amount: finalAmount * 100, // Amount in paise
                  currency: 'INR',
                  receipt: `order_rcptid_${orderid}`
              });
              return res.json({ order: razorpayOrder, orderid });
          } else if (paymentMethod === 'wallet') {
              // Deduct from wallet
              const totalWalletBalance = walletBalance - finalAmount;
              await userDb.findOneAndUpdate(
                  { _id: userId },
                  {
                      $inc: { wallet: -finalAmount },
                      $push: {
                          walletHistory: {
                              transactionDate: new Date(),
                              transactionAmount: finalAmount,
                              transactionDetails: "Purchased Product Amount.",
                              transactionType: "Debit",
                              currentBalance: totalWalletBalance,
                          },
                      },
                  },
                  { new: true }
              );
  
              await orderDb.findByIdAndUpdate(
                  { _id: orderid },
                  { $set: { "products.$[].paymentStatus": "Pending" } }
              );
  
              // Delete cart and update inventory
              await cartDb.deleteOne({ user: req.session.user_id });
              for (let i = 0; i < cartProducts.length; i++) {
                  const productId = cartProducts[i].productId;
                  const quantity = cartProducts[i].quantity;
                  await productDb.findOneAndUpdate(
                      { _id: productId },
                      { $inc: { qty: -quantity } }
                  );
              }
  
              return res.json({ success: true, orderid });
          } else {
              return res.status(400).send('Invalid payment method');
          }
      } catch (error) {
          console.log(error);
          if (!res.headersSent) {
              res.status(500).send('Internal Server Error');
          }
      }
  };
  
  
  
  const verifyPayment = async (req, res) => {
    try {
        const details = req.body;
        const userId = req.session.user_id;

        // Find the cart data
        const cartData = await cartDb.findOne({ user: userId });
        if (!cartData) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        const products = cartData.products;

        // Generate HMAC to verify payment
        const hmac = crypto.createHmac('sha256', process.env.KEY_SECRET);
        hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id);
        const hmacValue = hmac.digest('hex');

        if (hmacValue === details.payment.razorpay_signature) {
            // Extract order ID from receipt string
            const orderId = details.order.receipt.split('_')[2];
            const order = await orderDb.findById(orderId);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            // Update product quantities
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

            // Update order payment status and ID
            await orderDb.findByIdAndUpdate(orderId, {
                $set: { 'products.$[].paymentStatus': 'Pending', paymentId: details.payment.razorpay_payment_id }
            });

            // Handle coupon usage if applicable
            if (req.session.code) {
                await couponDb.updateOne(
                    { couponCode: req.session.code },
                    { $inc: { usersLimit: -1 }, $push: { usedUsers: userId } }
                );

                const coupon = await couponDb.findOne({ couponCode: req.session.code });
                if (coupon) {
                    const disAmount = coupon.discountAmount;
                    await orderDb.updateOne(
                        { _id: orderId },
                        { $set: { discount: disAmount } }
                    );
                }
            }

            // Clear the user's cart
            await cartDb.deleteOne({ user: userId });

            // Respond with success
            res.json({ codsuccess   : true, orderid: orderId });
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

  const loadOrderDetail = async (req, res)=>{
    try {
      
      const id = req.query.id;
      const userid = req.session.user_id;
      const userData = await userDb.findOne({_id: userid})
  // console.log('userData',userData);
  const orderData = await orderDb.findOne({_id:id}).populate("products.productId")
//   console.log('orderDat',orderData.products);
  res.render('orderDetails',{ orders:orderData})
    } catch (error) {
      
      console.log(error);

    }
  }

  //======================= cancelorder =======================
 //======================= cancelorder =======================
const cancelOrder = async (req, res) => {
  try {
    const { uniqueId, productId, total } = req.body;
    const userId = req.session.user_id; // Assuming the user ID is stored in the session
    
    // Retrieve the order data by unique ID
    const orderData = await orderDb.findOne({ _id: uniqueId });

    if (!orderData) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find the specific product within the order
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

    // Update the product's order status to "Cancelled" and save the changes
    productInfo.orderStatus = "Cancelled";
    productInfo.updatedAt = Date.now();
    await orderData.save();

    // Increase the product quantity in the inventory
    const quantityToIncrease = productInfo.quantity;
    const product = await productDb.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found in the database" });
    }

    product.qty += quantityToIncrease; // Increase the quantity in the inventory
    await product.save(); // Save the updated product data

    // Refund logic only if it's not COD
    if (orderData.paymentMethod !== 'COD') {
      let amountToCredit = parseInt(total); // Start with the original total amount
      
      // Apply coupon discount if present
      if (orderData.discount && orderData.discount > 0) {
        amountToCredit -= orderData.discount; // Subtract coupon discount
      }

      const userData = await userDb.findOne({ _id: userId });

      if (!userData) {
        return res.status(404).json({ message: "User not found" });
      }

      const totalWalletBalance = userData.wallet + amountToCredit;

      // Update user wallet and wallet history
      const result = await userDb.findOneAndUpdate(
        { _id: userId },
        {
          $inc: { wallet: amountToCredit },
          $push: {
            walletHistory: {
              transactionDate: new Date(),
              transactionAmount: amountToCredit,
              transactionDetails: 'Cancelled Product Amount Credited',
              transactionType: 'Credit',
              currentBalance: totalWalletBalance,
            },
          },
        },
        { new: true }
      );

      if (!result) {
        return res.status(404).json({ message: "Failed to update wallet" });
      }

      console.log('Wallet updated, new balance:', totalWalletBalance);
    }

    // Return a success response
    res.json({ cancel: 1, message: "Order canceled and amount credited to wallet" });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

  
// ==============================================================return user order============================================================

const productReturn = async (req, res) => {
  try {
    const orderId = req.query.orderid
    // console.log("orderId",orderId);
    

    const returnAmout = req.body.totalPrice;
    // console.log("returnAmout",returnAmout);
    
    const returnReasonDropdown = req.body.reasonDropdown;
    // console.log("returnReasonDropdown??????",returnReasonDropdown)
    const returnReasonText = req.body.reasonText;
    // console.log("returnReasonText!!!!!!!!!!!!!!!!!!",returnReasonText)
    // Use the dropdown reason if selected, otherwise use the text area reason
    const returnReason = returnReasonDropdown || returnReasonText;
    // console.log("returnReason",returnReason)
    
    const amount = parseInt(returnAmout)
    const orderData = await orderDb.findOne({ _id: orderId })

    const products = orderData.products
    const userData = await userDb.findOne({})
    let totalWalletBalance = userData.wallet + amount
    const productIdToCancel = req.query.productId;
    // console.log("productIdToCancel",productIdToCancel)

    const result = await userDb.findByIdAndUpdate(
      { _id: req.session.user_id },
      {
        $inc: { wallet: amount },
        $push: {
          walletHistory: {
            transactionDate: new Date(),
            transactionAmount: amount,
            transactionDetails: 'Returned Product Amount Credited.',
            transactionType: 'Credit',
            currentBalance: totalWalletBalance
          }
        }
      },
      { new: true }
    )

    if (result) {
      let updateQuery
      if (orderData.paymentMethod === 'COD') {
        updateQuery = {
          $set: {
            'products.$.returnOrderStatus.reason': returnReason,
            'products.$.orderStatus': 'Returned',
            'products.$.statusLevel': 6,
            'products.$.paymentStatus': 'Refund'
          }
        }
      } else {
        updateQuery = {
          $set: {
          'products.$.returnOrderStatus.reason': returnReason,
          'products.$.orderStatus': 'Returned',
          'products.$.statusLevel': 6,
          'products.$.paymentStatus': 'Refund'
          }
        }
      }

      const updatedData = await orderDb.updateOne(
        { _id: orderId, 'products.productId': productIdToCancel },
        updateQuery
      )

      if (updatedData) {
        for (let i = 0; i < products.length; i++) {
          const productId = products[i].productId
          const quantity = products[i].quantity
          await productDb.findByIdAndUpdate(
            { _id: productId },
            { $inc: { qty: quantity } }
          )
        }
        res.redirect('/orders')
      } else {
        console.log('Order not updated')
      }
    } else {
      console.log('User not found')
    }
  } catch (error) {
    console.log(error)
    res.render('500')
  }
}

const invoice = async (req, res, next) => {
  try {
    const orderId = req.query.id
    const order = await orderDb
      .findOne({ _id: orderId })
      .populate('products.productId')
    order.products.forEach(product => {})

    res.render('invoice', { order })
  } catch (error) {
    next(error)
  }
}


  
  module.exports = {
      loadCheckout,
      editAddressLoad,
      deleteAddress,
      shipaddAddress,
      placeOrder,
      verifyPayment,
      loadPlaceOrder,
      loadOrderPage,
      loadOrderDetail,
      cancelOrder,
      productReturn,
      invoice
  }