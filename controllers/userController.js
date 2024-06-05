  const { name } = require('ejs');
  const User = require('../models/userModel');
  const bcrypt = require('bcrypt');
  const Product = require('../models/productModel')
  const category = require('../models/categoryModel')
  const addressModel = require('../models/addressModel')
  const Brand = require('../models/brandModel');

  const nodemailer = require("nodemailer");

  const config = require("../config/config");

  const randormstring = require("randomstring");

  //adding secure password bcrypt

  const securePassword = async(password)=>{

      try {

        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
          
      } catch (error) {
          console.log(error.message);
          res.status(500).send('Server error');
          
      }

  }

  //===================code for generating the otp Random Number==========================================//

  const generateOTP = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };
    

  //===================code for sending the verification Email===========================================//
  const sendVerificationEmail = async (email, otp) => {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user:config.emailUser,
          pass: config.emailPassword
        },
      });

      const mailOptions = {
        from: config.emailUser,
        to: email,
        subject: "Verify Your Email",
        html: `<p>HI,
              Welcome to Speckart!,
              Your OTP is: <strong>${otp}</strong></p>`,
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.log(error);
    }
  };


  //=================to load the verify Otp Page===================================================================//

  const showverifyOTPPage = async (req, res) => {
      try {
        res.render("otpPage");
      } catch (error) {
        console.log(error);
      }
    };
    
    //==================code for inserting the User Data==================================================================>
    
    const insertUser = async (req, res) => {
      try {
        // Generate OTP
        const otpCode = generateOTP();
        const otpcurTime = Date.now() / 1000;
        const otpExpiry = otpcurTime + 180;
    
        const userCheck = await User.findOne({ email: req.body.email });
        if (userCheck) {
          res.render("signup", { message: "User already exist" });
        } else {
          const spassword = await securePassword(req.body.password);
          req.session.firstName = req.body.firstName;
          req.session.secondName = req.body.secondName;
          req.session.mobile = req.body.mobile;
          req.session.email = req.body.email;
          if (
            req.body.firstName &&
            req.body.email &&
            req.session.secondName &&
            req.session.mobile
          ) {
            if (req.body.password === req.body.cpassword) {
              req.session.password = spassword;
              req.session.otp = {
                code: otpCode,
                expiry: otpExpiry,
              };
              // Send OTP to the user's email
              sendVerificationEmail(req.session.email, req.session.otp.code);
              res.render("otpPage");
            } else {
              res.render("signup");
            }
          }
        }
      } catch (error) {
        console.log(error);
      }
    };
    //==================code for verifying the otp=========================================================================//

  const verifyOTP = async (req, res) => {
    try {
      if (req.body.otp === req.session.otp.code) {
        const user = new User({
          firstName: req.session.firstName,
          secondName: req.session.secondName,
          email: req.session.email,
          mobile: req.session.mobile,
          password: req.session.password,
          is_verified: 1,
        });

        const result = await user.save();

        // if(req.session.referralUserId) {
        //   const referringUser = await User.findById(req.session.referralUserId);

        //   const reward = 100;

        //   referringUser.wallet += reward;
        //   referringUser.walletHistory.push({
        //     transactionDate:new Date(),
        //     transactionAmount:reward,
        //     transactionDetails:'Referal Reward',
        //     transactionType:'Credit'
        //   });

        //   await referringUser.save();

        //   result.wallet += reward;
        //   result.walletHistory.push({
        //     transactionAmount: new Date(),
        //     transactionDate: reward,
        //     transactionDetails:'Referal Reward',
        //     transactionType:'Credit',
        //   })
        //   await result.save();
        // }
        
        res.redirect("/login");
      } else {
        res.render("otpPage", { message: "invalid OTP" });
      }
    } catch (error) {
      console.log(error);
    }
  };

    //============================ to resend the OTP ======================================================================//

  const resendOTP = async (req, res) => {
      try {
        const currentTime = Date.now() / 1000;
        if (req.session.otp.expiry != null) {
          if (currentTime > req.session.otp.expiry) {
            console.log(expired, req.session.otp.expiry);
            const newDigit = otpGenerator.generate(6, {
              digits: true,
              alphabets: false,
              specialChars: false,
              upperCaseAlphabets: false,
              lowerCaseAlphabets: false,
            });
    
            req.session.otp.code = newDigit;
            const newExpiry = currentTime + 45;
            req.session.otp.expiry = newExpiry;
            sendVerificationEmail(req.session.email, req.session.otp.code);
    
            res.render("otpPage", { message: "message:OTP has send" });
          } else {
            res.render("otpPage", {
              message: "You can request a new otp after old otp expires",
            });
          }
        } else {
          res.send("please Register again");
        }
      } catch (error) {
        console.log(error);
      }
    };
    


  //for reset password send mail

  const sendResetPasswordMail = async(name, email, token)=>{
  
      try {

        const transporter = nodemailer.createTransport({
              host:'smtp.gmail.com',
              port:587,
              secure:false,
              requireTLS:true,
              auth: {
                  user:config.emailUser, 
                  pass:config.emailPassword
              } 
          });
          const mailOptions = {
              from:config.emailUser,
              to:email,
              subject:'For Reset Password',
              html:'<p>Hii '+name+', please click here to <a href="http://127.0.0.1:3000/forget-password?token='+token+'"> Reset </a> your password.</p>' 
          }
          transporter.sendMail(mailOptions, function(error,info){
              if(error){
                  console.log(error);
              }
              else{
                  console.log("Email has been sent:- ",info.response);
              }
          })

      } catch (error) {
          console.log(error.message);
          res.status(500).send('Server error');
      }
  }


  //to load the the register page

  const loadRegister = async(req,res)=>{
      try {

          res.render('registration');
          
      } catch (error) {
          console.log(error.message);
          res.status(500).send('Server error');
      }
  }

  // //=================to load the verify Otp Page===================================================================//

  // const showverifyOTPPage = async (req, res) => {
  //     try {
  //       res.render("otpPage");
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   };

  // //==================code for inserting the User Data==================================================================>

  // const insertUser = async (req, res) => {
  //     try {
  //       // Generate OTP
  //       const otpCode = generateOTP();
  //       const otpcurTime = Date.now() / 1000;
  //       const otpExpiry = otpcurTime + 180;
    
  //       const userCheck = await User.findOne({ email: req.body.email });
  //       if (userCheck) {
  //         res.render("registration", { message: "User already exist" });
  //       } else {
  //         const spassword = await securePassword(req.body.password);
  //         req.session.firstName = req.body.firstName;
  //         req.session.secondName = req.body.secondName;
  //         req.session.mobile = req.body.mobile;
  //         req.session.email = req.body.email;
  //         if (
  //           req.body.firstName &&
  //           req.body.email &&
  //           req.session.secondName &&
  //           req.session.mobile
  //         ) {
  //           if (req.body.password === req.body.cpassword) {
  //             req.session.password = spassword;
  //             req.session.otp = {
  //               code: otpCode,
  //               expiry: otpExpiry,
  //             };
  //             // Send OTP to the user's email
  //             sendVerificationEmail(req.session.email, req.session.otp.code);
  //             res.render("otpPage");
  //           } else {
  //             res.render("registration");
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   };


  // // email verifying

  // const verifyMail = async(req,res)=>{

  //     try{

  //        const updateInfo = await User.updateOne({_id: req.query.id}, { $set: { is_verified:1 } });

  //         res.render("email-verified");

  //     } catch (error) {
  //         console.log(error.message);
  //         res.status(500).send('Server error');
  //     }
  // }

  // login user method started

  const loginLoad = async(req,res)=>{

      try {

          res.render('login');
          
      } catch (error) {
          console.log(error.message);
          res.status(500).send('Server error');
      }
  }

  //verify login in email

  // const verifyLogin = async(req,res)=>{

    
  //     try {

  //         const email = req.body.email;
  //         const password = req.body.password;
  //        const userData = await User.findOne({email:email});

  //         if(userData){

  //           const passwordMatch = await bcrypt.compare(password,userData.password);
  //           if(passwordMatch){
  //                 if(userData.is_verified === 0){
  //                     res.render('login',{message:"Please verify your email."});
  //                 }
  //                 else{
  //                     req.session.user_id = userData._id;
  //                     res.redirect('/');
  //                 }

  //             }

  //             else{
  //                 res.render('login',{message:"Email and password is incorrect"});
  //             }

  //         }
  //         else{
  //             res.render('login',{message:"Email and password is incorrect"});
  //         }
          
          
  //     } catch (error) {
  //         console.log(error.message);
  //         res.status(500).send('Server error');
          
  //     }
  // }

  //==========================code for verifying the login===============================================================//

  const verifyLogin = async (req, res, next) => {
    try {
      const email = req.body.email;
      const password = req.body.password;

      const userData = await User.findOne({ email: email });
      if (userData) {
        if (userData.is_block === false) {
          const passwordMatch = await bcrypt.compare(password, userData.password);

          if (passwordMatch) {
            if (userData.is_verified == 0) {
              req.session.user_id = userData._id;
              res.render("login", { message: "please verify your mail" });
            } else {
              req.session.user_id = userData._id;
              res.redirect("/");
            }
          } else {
            res.render("login", { message: "Email and  password is incorrect" });
          }
        } else if (userData.is_block ){
          res.render("login", { message: "This User is blocked" });
        }
      } else {
        res.render("login", { message: "Email and  password is incorrect" });
      }
    } catch (err) {
      next(err);
    }
  };  

            
  //load home

  const loadHome = async(req,res)=>{
      try{

          const productData = await Product.find({is_active:true})
          // console.log('profuct data',productData);
          const categoryData = await category.find({is_block:false})
          
          res.render('home',{ 
              user:req.session.user_id,
              products : productData,   
              categoryData
              });
              

      } catch (error) {
          console.log(error.message);
          res.status(500).send('Server error');
      }
  }

  //user logout section

  const userLogout = async(req,res)=>{
      try {

          req.session.user_id=null;
          res.redirect('/');
          
      } catch (error) {
          console.log(error.message);        
          res.status(500).send('Server error');
      }

  }

  //forget password code start

  const forgetLoad = async(req,res)=>{
      try {

          res.render('forget');
          
      } catch (error) {
          console.log(error.message);
      }
  }

  //forget password verifying

  const forgetVerify = async(req,res)=>{

      try {

          const email = req.body.email;
          const userData = await User.findOne({ email: email });
          if(userData){
              if(userData.is_verified === 0){
                  res.render('forget',{message:"Please verify your mail."});
              }
              else{
                      const randomString = randormstring.generate();
                  const updatedData = await User.updateOne({email:email},{$set:{ token:randomString }});
                  sendResetPasswordMail(userData.name,userData.email,randomString);
                  res.render('forget',{message:"Please check your mail to reset your password."}); 
              }

          }
          else{
              res.render('forget',{message:"User email is incorrect."});
          }
          
      } catch (error) {
          console.log(error.message);
          res.status(500).send('Server error');
      
      }
  }

  //forget password load reset in mail

  const forgetPasswordLoad = async(req,res)=>{

      try {

          const token = req.query.token;
          const tokenData = await User.findOne({token:token});
          if(tokenData){
              res.render('forget-password',{user_id:tokenData._id});
          }
          else{
              res.render('404',{message:"Token is invalid."});
          }
          
      } catch (error) {
          console.log(error.message);
          res.status(500).send('Server error');
      }

  }

  const resetPassword = async(req,res)=>{
      try {

          const password = req.body.password;
          const user_id = req.body.user_id;

          const secure_password = await securePassword(password);

        const updatedData = await User.findByIdAndUpdate({ _id:user_id },{ $set:{ password:secure_password, token:'' } });

          res.redirect("/");
          
      } catch (error) {
          console.log(error.message);
          res.status(500).send('Server error');
      }
  }

  //for verification sent mail link

  const verificationLoad = async(req,res)=>{

      try {
          
          res.render('verification'); 

      } catch (error) {
          console.log(error.message);
          res.status(500).send('Server error');
      }
  }

  //sending email verification link

  const sentVerificationLink = async(req,res)=>{

      try {

          const email = req.body.email;
          const userData = await User.findOne({ email:email });
          if(userData){

              sendVerifyMail(userData.name, userData.email, userData._id);

              res.render('verification',{ message:"Reset verification mail sent your mail id,please check."});

          }
          else{
              res.render('verification',{message:"This email is not exist."});
          }
          
      } catch (error) {
          console.log(error.message);
          res.status(500).send('Server error');
      }
  }

  //user profile edit and update

  const editLoad = async(req,res)=>{

      try {

          const id = req.query.id;

          const userData = await User.findById({ _id:id });

          if(userData){
              res.render('edit', { user:userData });
          }
          else{
              res.redirect('/home');
          }
          
      } catch (error) {
          console.log(error.message);
          res.status(500).send('Server error');
      }
  }

  //update profile method

  const updateProfile = async(req,res)=>{ 

      try {

          if(req.file){
              const userData = await User.findByIdAndUpdate({ _id:req.body.user_id },{ $set:{name:req.body.name, email:req.body.email, mobile:req.body.mno, image:req.file.filename} });
          }
          else{
            const userData = await User.findByIdAndUpdate({ _id:req.body.user_id },{ $set:{name:req.body.name, email:req.body.email, mobile:req.body.mno} });
          }

          res.redirect('/home');


          
      } catch (error) {
          console.log(error.message);
          res.status(500).send('Server error');
      }
  }
  //==================================== to load the shop page =================================================//

  const loadShop = async (req, res) => {
      try {

        // Search
        var search='';
        if(req.query.search){
            search=req.query.search;
        }

        // Pagination
        var page=1;
        if(req.query.page){
            page =req.query.page;
        }

        const limit=8;

        const user =  await User.findById(req.session.user_id);
        const categoryData = await category.find({is_block:false});
          const brandData = await Brand.find({is_block:false});
          const products = await Product.find({
            is_active: true,
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { category: { $regex: search, $options: 'i' } },
              { brandName: { $regex: search, $options: 'i' } },
            ]
          })
          .limit(limit)
          .skip((page - 1) * limit)
          .exec();
          

          // Count of pages
          const count = await Product.find({
            is_active:true,
            $or:[
                {name:{$regex:'.*'+search+'.*',$options:'i'}},
                {category:{$regex:'.*'+search+'.*',$options:'i'}},
                {brandName:{$regex:'.*'+search+'.*',$options:'i'}},
            ]
        }).countDocuments()

        res.render('shop', {
          user,
          products,
          categoryData,
          brandData,
          totalPages:Math.ceil(count/limit),  //Ex:- count of document/limit (9/6 = 1.5 => 2)
          currentPage:page,   // page 1
          title:'shop'});

      } catch (error) {
        console.log(error);
      }   
    };

  const profileLoad = async (req,res)=>{
    try {
      const userId = req.session.user_id
      const userData = await User.findById(userId) ;
      const addressData = await addressModel.findOne({userId : req.session.user_id})
        res.render('profile',{ user: userData,address:addressData})
      
    } catch (error) {
      console.log(error.message);
    }
  }


  const editProfile = async (req,res)=>{
    try {

      const userData = req.body.user_id;
      // console.log('userData',userData);

    
      const userDataChange = await User.findByIdAndUpdate({_id:userData},{$set:{firstName:req.body.firstName, secondName:req.body.secondName, mobile:req.body.mobile}})
      res.redirect('/profile')
      // console.log('userDataChange',userDataChange);





    } catch (error) {
      console.log(error);
    }
  }

  const updatePassword = async (req, res)=>{

    try {
      
      const userData = await User.findOne ({_id: req.session.user_id})

      // console.log('userData',userData);

      const isPasswordMatch = await bcrypt.compare(req.body.oldPassword, userData.password)
      // console.log('isPasswordMatch',isPasswordMatch);

      if(isPasswordMatch){

        const newCreatePassword =await bcrypt.hash(req.body.newPassword,10);
        // console.log('newCreatePassword',newCreatePassword);

        const newPasswordSet = await User.updateOne({_id:userData},{$set:{password: newCreatePassword}});
        // console.log('newPasswordSet',newPasswordSet);

        res.redirect('/profile')

      }else{
        return res.status(400)
      }

    } catch (error) {
      
      console.log(error);

    }
  }



  const addAddress = async (req, res, next) => {
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

      res.redirect('/profile')

    } catch (error) {
      console.log(error);
      // Handle the error appropriately, you might want to send an error response or call the 'next' middleware
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  const editAddressLoad = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const addressId = req.query.id;

      // Find the user by userId and retrieve the specific address using its id
      const user = await addressModel.findOne({ userId });
      // console.log('user',user);
      const addressToEdit = user.address.id(addressId);
      // console.log('addressToEdit',addressToEdit); 

      // Render the 'editAddress' template and pass the user and specific address
      res.render('editAddress', { user, address: addressToEdit });

    } catch (error) {
      console.log(error);
    }
  };


  const editAddress = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const id = req.body.id;

      const editAddress = await addressModel.updateOne(
        { userId, "address._id": id },
        {
          $set: {
            "address.$.fullName": req.body.fullName,
            "address.$.mobile": req.body.mobile,
            "address.$.state": req.body.state,
            "address.$.district": req.body.district,
            "address.$.city": req.body.city,
            "address.$.pincode": req.body.pincode,
          },
        }
      );

      res.redirect('/profile');
    } catch (error) {
      console.log(error);
    }
  };

  const deleteAddress = async (req, res) => {
    const userId = req.session.user_id; 
    const addressId = req.body.id; 

    try {
      const result = await addressModel.findOneAndUpdate(
        { userId },
        { $pull: { address: { _id: addressId } } },
        { new: true } // To get the updated document
      );

      // console.log('resutlt',result);

      if (result) {
        // Respond with a success message
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
      loadRegister,
      insertUser,
      verifyOTP,
      resendOTP,
      showverifyOTPPage,
      // verifyMail,  
      loginLoad,
      verifyLogin,
      loadHome, 
      userLogout,
      forgetLoad,
      forgetVerify,
      forgetPasswordLoad,
      resetPassword,
      verificationLoad,
      sentVerificationLink,
      editLoad,
      updateProfile,
      loadShop,
      profileLoad,
      editProfile,
      updatePassword,
      addAddress,
      editAddressLoad,
      editAddress,
      deleteAddress,
      

  }