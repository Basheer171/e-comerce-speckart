const userDb = require('../models/userModel')
const addressModel = require('../models/addressModel')



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

module.exports = {
    loadCheckout,
}