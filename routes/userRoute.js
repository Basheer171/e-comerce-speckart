const express = require("express");
const user_route = express();
const session = require("express-session");
const path = require("path")
const config = require("../config/config");

user_route.use(session({secret:config.sessionSecret,resave: false,saveUninitialized: true,}));

const auth = require("../middleware/auth");


// view and model connecting in controller

user_route.set('view engine','ejs');
user_route.set('views','./views/users');

user_route.use(express.static(path.join(__dirname, "public"), { maxAge: 3600000 }));
const bodyParser = require('body-parser'); 
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}));


user_route.use('/public',express.static('public'));





const userController = require("../controllers/userController");
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');





user_route.get('/register',auth.isLogout, userController.loadRegister);

user_route.post('/register', userController.insertUser);

user_route.get('/submit-otp', userController.showverifyOTPPage);
user_route.post('/submit-otp', userController.verifyOTP)
user_route.get('/resend-otp', userController.resendOTP) 




// user_route.get('/verify',userController.verifyMail);

user_route.get('/', userController.loadHome);

user_route.get('/login',auth.isLogout, userController.loginLoad);

user_route.post('/login',userController.verifyLogin);



user_route.get('/logout',auth.isLogin,userController.userLogout);

user_route.get('/forget',auth.isLogout,userController.forgetLoad);

user_route.post('/forget',userController.forgetVerify);

user_route.get('/forget-Password',auth.isLogout,userController.forgetPasswordLoad);

user_route.post('/forget-Password',userController.resetPassword);

user_route.get('/verification',userController.verificationLoad);

user_route.post('/verification',userController.sentVerificationLink);

user_route.get('/edit',auth.isLogin,userController.editLoad);

user_route.post('/edit',userController.updateProfile);

    
//================= to load the shop page =================
user_route.get('/shop',userController.loadShop);


user_route.get('/product',auth.isLogin,productController.loadProductPageLoad);


// ========================  cart   ==========================

user_route.post('/addToCart',auth.isLogin,cartController.addToCart);
user_route.get('/cart',auth.isLogin, auth.is_blocked, cartController.loadCart );
user_route.post('/cart-quantity',auth.isLogin,cartController.cartQuantity )
user_route.post('/remove-product',auth.isLogin,cartController.removeProduct )

// ========================  profile   ==========================

user_route.get('/profile',auth.isLogin, auth.is_blocked,userController.profileLoad );
user_route.post('/updateuser',auth.isLogin,userController.editProfile );
user_route.post('/changepassword',auth.isLogin,userController.updatePassword)
user_route.post('/addAddress',auth.isLogin,userController.addAddress)
user_route.get('/editAddress',auth.isLogin, auth.is_blocked, userController.editAddressLoad );
user_route.post('/editAddress',auth.isLogin,userController.editAddress);
user_route.delete('/deleteAddress',auth.isLogin,userController.deleteAddress)


// ========================  checkout   ==========================

user_route.get('/checkout',auth.isLogin,  auth.is_blocked, orderController.loadCheckout );
user_route.get('/editCheckout',auth.isLogin,  auth.is_blocked,orderController.editAddressLoad );
user_route.delete('/deleteAddress',auth.isLogin,orderController.deleteAddress)
user_route.post('/shipAddAddress',auth.isLogin,orderController.shipaddAddress);



user_route.post('/placeOrder',auth.isLogin,orderController.placeOrder);
user_route.get('/orderPlace',auth.isLogin,orderController.loadPlaceOrder );
user_route.get('/orders',auth.isLogin,orderController.loadOrderPage );
user_route.get('/orderDetails',auth.isLogin,orderController.loadOrderDeatail );
user_route.post('/cancelOrder',orderController.cancelOrder)



module.exports = user_route;   