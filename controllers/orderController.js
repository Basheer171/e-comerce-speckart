const userDb = require('../models/userModel')


const loadCheckout = async (req, res)=>{
try {
    
    const userId = req.session.user_id;
    const userData = await userDb.findById(userId)

    res.render('checkout',({user: userData}))

} catch (error) {
    console.log(error);
}
}

module.exports = {
    loadCheckout,
}