const mongoose = require('mongoose');

const userDb = require('../models/userModel')

const addressDb = require('../models/addressModel');
const addressModel = require('../models/addressModel');
const cartDb = require('../models/cartModel');
const productDb = require('../models/productModel');
const orderDb = require('../models/orderModels')
const couponDb = require('../models/coupenModel')
const Razorpay = require("razorpay");
const crypto = require('crypto');
const { log } = require('console');


var razorpayInstance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret
});



const loadCheckout = async (req, res) => {
  try {

    const userId = req.session.user_id;
    const userData = await userDb.findOne({ _id: userId });

    const couponData = await couponDb.find({ status: true });

    const wallet = userData.wallet;

    const addressData = await addressModel.findOne({ userId: userId })
    const cartData = await cartDb.findOne({ user: userId }).populate("products.productId");

    if (req.session.user_id) {
      if (cartData && cartData.products.length > 0) {

        const Total = cartData.products.reduce((acc, product) => {
          return acc + product.price * product.quantity;
        }, 0);

        res.render('checkout', { user: userId, address: addressData, cart: cartData, Total, wallet, couponData });
      } else {
        res.render('checkout', { user: userId, address: addressData, cart: [], Total: 0, wallet });
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
    const user = await addressModel.findOne({ userId });

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

    const userAddress = await addressModel.findOne({ userId: req.session.user_id })

    let userAddresscreat;

    if (!userAddress) {

      userAddresscreat = new addressModel({

        userId: req.session.user_id,
        address: [
          {
            fullName: req.body.fullName,
            mobile: req.body.mobile,
            state: req.body.state,
            district: req.body.district,
            city: req.body.city,
            pincode: req.body.pincode
          }]

      })

    } else {

      userAddresscreat = userAddress

      userAddresscreat.address.push({
        fullName: req.body.fullName,
        mobile: req.body.mobile,
        state: req.body.state,
        district: req.body.district,
        city: req.body.city,
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
    const walletBalance = userData.wallet;
    const name = userData.firstName;

    const uniNum = Math.floor(Math.random() * 900000) + 100000;

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
      paymentStatus: 'Pending',  // Initial status as "Pending"
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

    // Check if payment method is COD and final amount is greater than ₹1000
    if (paymentMethod === 'COD' && finalAmount > 1000) {
      return res.status(400).json({ error: 'Cash on Delivery is available only for orders below ₹1000.' });
    }

    // Wallet validation but store order in "pending" state if balance is insufficient
    if (paymentMethod === 'wallet' && walletBalance < finalAmount) {
      // Update the cartProducts to reflect the failed order status
      const updatedCartProducts = cartData.products.map((product) => ({
        productId: product.productId,
        quantity: product.quantity,
        orderStatus: 'Failed',
        statusLevel: 1,
        totalPrice: product.quantity * product.price,
        productPrice: product.price,
        paymentStatus: 'Pending',  // Initial status as "Pending"
        'returnOrderStatus.status': 'none',
        'returnOrderStatus.reason': 'none',
      }));

      // console.log("updatedCartProducts",updatedCartProducts)
      const order = new orderDb({
        deliveryDetails: address,
        uniqueId: uniNum,
        userId: userId,
        userName: name,
        paymentMethod: paymentMethod,
        products: updatedCartProducts, // Use updated products
        totalAmount: finalAmount,
        date: new Date(),
        expectedDelivery: deliveryDate,
        discount: discountAmount,
        couponDiscount: couponDiscount,
      });

      const orderData = await order.save();
      // console.log("orderData//////////////////", orderData);
      return res.json({
        success: false,
        message: "Insufficient wallet balance. The order is pending, awaiting payment.",
        orderid: order._id
      });
    }

    // Create the order in DB initially with "Pending" payment status
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
      couponDiscount: couponDiscount,
    });

    const orderData = await order.save();
    const orderid = order._id;

    // Handle COD payment
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
    }

    // Handle online payment (Razorpay)
    if (paymentMethod === 'online') {
      try {
        const razorpayOrder = await razorpayInstance.orders.create({
          amount: finalAmount * 100, // Amount in paise
          currency: 'INR',
          receipt: `order_rcptid_${orderid}`
        });
        return res.json({ order: razorpayOrder, orderid });
      } catch (error) {
        // If Razorpay order creation fails, keep the order as "Pending"
        console.error("Razorpay order creation error:", error);
        return res.json({
          success: false,
          message: "There was an error with the payment gateway. Your order is pending, please try again.",
          orderid: orderid
        });
      }
    }

    // Handle wallet payment (successful)
    if (paymentMethod === 'wallet') {
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
        { $set: { "products.$[].paymentStatus": "Complete" } }
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
    }

    // Default response for other cases (not expected)
    return res.status(400).send('Invalid payment method');
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
    // console.log("hmac",hmac)
    hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id);
    const hmacValue = hmac.digest('hex');
    // console.log("hmacValue",hmacValue)

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
        $set: { 'products.$[].paymentStatus': 'Complete', paymentId: details.payment.razorpay_payment_id }
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
      res.json({ codsuccess: true, orderid: orderId });
    } else {
      await orderDb.findByIdAndUpdate(userId, {
        $set: { 'products.$[].orderStatus': 'Failed' }
      });
      res.status(400).json({ message: 'Invalid signature' });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).send('Internal Server Error');
  }
};



const loadPlaceOrder = async (req, res) => {
  try {

    const id = req.session.user_id;
    // console.log('id',id);
    const userData = await userDb.findOne({ _id: id })
    // console.log('userData',userData);

    res.render('orderPlace', { user: userData })

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

const loadOrderDetail = async (req, res) => {
  try {

    const id = req.query.id;
    const userid = req.session.user_id;
    const userData = await userDb.findOne({ _id: userid })
    // console.log('userData',userData);
    const orderData = await orderDb.findOne({ _id: id }).populate("products.productId")
    //   console.log('orderDat',orderData.products);
    res.render('orderDetails', { orders: orderData })
  } catch (error) {

    console.log(error);

  }
}

//======================= cancelorder =======================
const cancelOrder = async (req, res) => {
  try {
    const { uniqueId, productId, total } = req.body;
    const userId = req.session.user_id; 
   
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

    if (productInfo.orderStatus === 'Delivered') {
      return res.status(400).json({ message: "Cannot cancel a delivered order" });
    }

    productInfo.orderStatus = "Cancelled";
    productInfo.updatedAt = Date.now();
    await orderData.save();

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

      // console.log('Wallet updated, new balance:', totalWalletBalance);
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
    const { orderid: orderId, productId: productIdToCancel } = req.query;

    // Find the order details by the order ID
    const orderData = await orderDb.findOne({ _id: orderId });

    if (!orderData) {
      return res.status(404).send('Order not found');
    }

    // Check if there's a coupon discount, and set return amount accordingly
    const returnAmount = orderData.couponDiscount ? orderData.couponDiscount : orderData.totalAmount;

    // Continue with your existing logic to handle the return
    const userData = await userDb.findOne({ _id: req.session.user_id });

    if (!userData) {
      return res.status(404).send('User not found');
    }

    let totalWalletBalance = userData.wallet + returnAmount;

    const userUpdateResult = await userDb.findByIdAndUpdate(
      req.session.user_id,
      {
        $inc: { wallet: returnAmount },
        $push: {
          walletHistory: {
            transactionDate: new Date(),
            transactionAmount: returnAmount,
            transactionDetails: 'Returned Product Amount Credited.',
            transactionType: 'Credit',
            currentBalance: totalWalletBalance
          }
        }
      },
      { new: true }
    );

    if (!userUpdateResult) {
      return res.status(500).send('Failed to update user wallet');
    }

    // Handle the update of the order status
    const updateQuery = {
      $set: {
        'products.$.returnOrderStatus.reason': req.body.reasonDropdown || req.body.reasonText,
        'products.$.orderStatus': 'Returned',
        'products.$.statusLevel': 6,
        'products.$.paymentStatus': 'Refund'
      }
    };

    const updatedData = await orderDb.updateOne(
      { _id: orderId, 'products.productId': productIdToCancel },
      updateQuery
    );

    if (updatedData) {
      // Increment the product quantity back into stock
      for (let i = 0; i < orderData.products.length; i++) {
        const productId = orderData.products[i].productId;
        const quantity = orderData.products[i].quantity;
        await productDb.findByIdAndUpdate(
          { _id: productId },
          { $inc: { qty: quantity } }
        );
      }
      res.redirect('/orders');
    } else {
      res.status(500).send('Order not updated');
    }

  } catch (error) {
    console.error(error);
    res.render('500');
  }
};


const invoice = async (req, res, next) => {
  try {
    const orderId = req.query.id
    const order = await orderDb
      .findOne({ _id: orderId })
      .populate('products.productId')
    order.products.forEach(product => { })

    res.render('invoice', { order })
  } catch (error) {
    next(error)
  }
}

const retryOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { orderId, productId } = req.body;

    // Find user and order details
    const userData = await userDb.findOne({ _id: userId });
    if (!userData) return res.json({ retry: 0, message: 'User not found' });

    const walletBalance = userData.wallet;
    const orderData = await orderDb.findOne({ _id: orderId });
    if (!orderData) return res.json({ retry: 0, message: 'Order not found' });

    const paymentMethod = orderData.paymentMethod;

    // Find order by ID and product
    const order = await orderDb.findOne({ _id: orderId, "products.productId": productId });
    if (!order) return res.json({ retry: 0, message: 'Order not found' });

    const product = order.products.find(p => p.productId.toString() === productId.toString());
    if (!product) return res.json({ retry: 0, message: 'Product not found in order' });

    const totalPrice = product.totalPrice;
    const productIndex = order.products.findIndex(p => p.productId.toString() === productId);

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

    const finalAmount = totalPrice - discountAmount;

    // Only retry if the product status is 'Failed' and wallet balance is sufficient
    if (productIndex > -1 && order.products[productIndex].orderStatus === 'Failed') {
      if (walletBalance >= finalAmount) {
        // Update order status to 'Placed'
        order.products[productIndex].orderStatus = 'Placed';
        await order.save();

        // Handle wallet payment
        if (paymentMethod === 'wallet') {
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
            { _id: orderId },
            { $set: { "products.$[].paymentStatus": "Complete" } }
          );

          // Delete cart and update inventory
          await cartDb.deleteOne({ user: req.session.user_id });

          for (let i = 0; i < order.products.length; i++) {
            const productId = order.products[i].productId;
            const quantity = order.products[i].quantity;

            await productDb.findOneAndUpdate(
              { _id: productId },
              { $inc: { qty: -quantity } }
            );
          }

          return res.json({ success: true, orderId, message: 'Order status updated to Placed.' });
        }
      } else {
        return res.json({ walletFailed: true, message: "Insufficient wallet balance. The order is pending, awaiting payment." });
      }
    } else {
      return res.json({ retry: 0, message: 'Order cannot be retried or status is not Failed' });
    }
  } catch (error) {
    console.error("Error retrying order:", error);
    return res.status(500).json({ retry: 0, message: 'Internal server error' });
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
  loadOrderDetail,
  cancelOrder,
  productReturn,
  invoice,
  retryOrder
}