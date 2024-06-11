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
// Check user is blocked/not
const is_blocked = async (req, res, next) => {
    try {
        const userData = await User.findById(req.session.user_id);
        
        if (!userData) {
            return res.render('login', { message: 'User not found' });
        }

        if (userData.is_block === true) {
            return res.render('login', { message: 'Blocked By Admin' });
        } else {
            next();
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
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