const userDb = require('../models/userModel')
const addressDb = require('../models/addressModel');
const addressModel = require('../models/addressModel');



const loadCheckout = async (req, res)=>{
try {
    
    const userId = req.session.user_id;
    const userData = await userDb.findById(userId)

    const addressData = await addressModel.findOne({userId:userId})

    res.render('checkout',({user: userData,address : addressData}))

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
  

module.exports = {
    loadCheckout,
    editAddressLoad,
    deleteAddress
}