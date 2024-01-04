const User = require("../models/userModel");


const fetchUserData = async (req, res, next) => {
    try {
        const userId = req.session.user_id;

        if (userId) {
            const user = await User.findById(userId);
            res.locals.user = user;  // Set user data to res.locals.userData
        } else {
            res.locals.user = null;  // Set null when there is no user
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = fetchUserData;