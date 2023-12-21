const userDb = require('../models/userModel')
const addressDb = require('../models/addressModel');
const addressModel = require('../models/addressModel');
const cartDb = require('../models/cartModel');
const productDb = require('../models/productModel');
const orderDb  = require ('../models/orderModels')



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
        // console.log('userId',userId);
        const address = req.body.address; 

        console.log('address',address);

        const cartData = await cartDb.findOne({ user: userId });
        // console.log('cartData',cartData);
        const total = parseInt(req.body.totalAmount);
        // console.log('total',total);
        const paymentMethod = req.body.paymentMethod;
        // console.log('paymentMethod',paymentMethod);
        const userData = await userDb.findOne({ _id: userId });
        // console.log('userData',userData);
        const name = userData.firstName;
        // console.log('name',name);

        const uniNum = Math.floor(Math.random() * 900000) + 100000;
        // console.log('uniNum',uniNum);
        const status = paymentMethod === 'COD' ? 'placed' : 'pending';
        // console.log('status',status);
        const statusLevel = status === 'placed' ? 1 : 0;
        // console.log('statusLevel',statusLevel);

        const today = new Date();
        // console.log('today',today);
        const deliveryDate = new Date(today);
        // console.log('deliveryDate',deliveryDate);
        deliveryDate.setDate(today.getDate() + 7);

        const cartProducts = cartData.products.map((productItem) => ({
            productId: productItem.productId,
            quantity: productItem.quantity,
            orderStatus: 'Placed',
            statusLevel: 1,
            paymentStatus: 'Pending',
        }));
        // console.log('cartProducts',cartProducts);


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
        // console.log('orderData',orderData);
        const orderid = order._id;
        // console.log('orderid',orderid);

        if (orderData) {
            if (paymentMethod === 'COD') {
                for (const item of cartData.products) {
                    const productId = item.productId._id;
                    const quantity = parseInt(item.quantity, 10);
                    const result = await productDb.updateOne(
                        { _id: productId },
                        { $inc: { qty: -quantity } }
                    );
                }
                res.json({ success: true, orderid });
            }

            // Clear the user's cart after placing the order
            await cartDb.findOneAndUpdate({ userId: userId }, { $set: { products: [] } });
        } else {
            // Handle the case when orderData is not available
            res.status(400).send('Failed to place the order');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const loadPlaceOrder = async (req, res)=>{
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
    
    // Find all orders for the user
    const orderData = await orderDb.find({ userId: userId });

    // Find user data for additional information
    const userData = await userDb.findById(userId);

    res.render('orders', { user: userData, orderData });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
};


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


module.exports = {
    loadCheckout,
    editAddressLoad,
    deleteAddress,
    shipaddAddress,
    placeOrder,
    loadPlaceOrder,
    loadOrderPage,
    loadOrderDeatail
}