const userDb = require('../models/userModel')
const addressDb = require('../models/addressModel');
const addressModel = require('../models/addressModel');
const cartDb = require('../models/cartModel')



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
  
  

module.exports = {
    loadCheckout,
    editAddressLoad,
    deleteAddress,
    shipaddAddress,
}