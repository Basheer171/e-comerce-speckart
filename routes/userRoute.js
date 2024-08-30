const express = require("express");
const user_route = express();
const session = require("express-session");
const path = require("path")
const config = require("../config/config");
const User = require('../models/userModel')
const googleStrategy = require('passport-google-oauth20').Strategy;
const passport =require('passport')

const auth = require("../middleware/auth");
const fetchUserData = require("../middleware/userData")

// view and model connecting in controller

user_route.set('view engine','ejs');
user_route.set('views','./views/users');

user_route.use(express.static(path.join(__dirname, "public"), { maxAge: 3600000 }));
user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}));


user_route.use('/public',express.static('public'));






const wishListController = require("../controllers/whishlistController")
const userController = require("../controllers/userController");
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController')

user_route.use(fetchUserData)

passport.use(new googleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret:process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:"/auth/google/callback"
},async (accessToken,refreshToken,profile,done) => {
  // console.log(accessToken);
  // console.log(refreshToken);
  // console.log(profile);
  try {
    const user = await User.findOne({email: profile.emails[0].value});    
    
    if(user) {
      done(null,user);
    } else {
      const newUser = new User({
        email: profile.emails[0].value,
        firstName: profile.displayName,
        isVerified:1,
      });

      await newUser.save();
      done(null,newUser);
    }
  } catch (error) {
    done(error,false);
  }
}
))

passport.serializeUser((user,done) => {
  done(null,user.id);
})


passport.deserializeUser(async(id,done)=> {
  try {
    const user= await User.findById(id);
    done(null,user);
  } catch (error) {
    done(error,false);
  }
})


user_route.get('/auth/google',passport.authenticate('google',{
  scope:["profile","email"]
}));

user_route.get('/auth/google/callback',passport.authenticate('google',{
  failureRedirect:'/login'
}),async function (req,res) {
  // console.log(req.user.email);
  const userEmail = req.user.email;
  const user = await User.findOne({email:userEmail});

  if(user){
    req.session.user_id = user._id;
    res.redirect('/')
  } else {
    res.redirect('/login')
  }

})


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

user_route.post('/verifyPayment',auth.isLogin, orderController.verifyPayment);


user_route.get('/editCheckout',auth.isLogin,  auth.is_blocked,orderController.editAddressLoad );
user_route.delete('/deleteAddress',auth.isLogin,orderController.deleteAddress)
user_route.post('/shipAddAddress',auth.isLogin,orderController.shipaddAddress);



user_route.post('/placeOrder',auth.isLogin,orderController.placeOrder);
user_route.get('/orderPlace/:id',auth.isLogin,orderController.loadPlaceOrder );
user_route.get('/orders',auth.isLogin,orderController.loadOrderPage );
user_route.get('/orderDetails',auth.isLogin,orderController.loadOrderDetail );
user_route.post('/cancelOrder',auth.isLogin,orderController.cancelOrder)

  user_route.get('/coupon', auth.isLogin, couponController.couponUserPageLoad);
  user_route.post('/couponApply', auth.isLogin, couponController.applyCoupon);
  user_route.post('/deleteCoupon', auth.isLogin, couponController.deleteAppliedCoupon);

user_route.get('/wallet', auth.isLogin,userController.load_wallet);
user_route.post('/profile/addMoneyToWallet',auth.isLogin, userController.addMoneyToWallet);
user_route.post('/verifyWalletpayment',auth.isLogin, userController.verifyWalletpayment);
user_route.get('/walletHistory', auth.isLogin, userController.walletHistory)


//============================== wishList Related ==========================//


user_route.get('/wishlist',auth.isLogin,wishListController.load_whislist);
user_route.post('/addToWishlist',auth.isLogin,wishListController.addToWishlist);






user_route.get('*',(req,res)=>{

    res.render('404')
  })



module.exports = user_route;   