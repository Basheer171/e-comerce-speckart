const User = require('../models/userModel');

const isLogin = async (req, res, next) => {
    
    try {
        if (req.session.user_id) {
             next(); // Proceed to the next middleware or route
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message);
        res.redirect('/login'); // Handle errors by redirecting
    }
}

// Check user is blocked/not
const is_blocked = async(req, res, next)=>{
    try {

        const userData = await User.findById(req.session.user_id);
        // console.log('user data', userData);
        if(userData.is_block===false){

            res.render('login',{message:'Blocked By Admin'});
        }else{
            next();
        }

    } catch (error) {
        console.log(error);
    }
};


const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            res.redirect('/');
        } else {
             next(); // Proceed to the next middleware or route
        }
    } catch (error) {
        console.log(error.message);
        res.redirect('/'); // Handle errors by redirecting
    }
}


module.exports ={
    isLogin,
    is_blocked,
    isLogout
}