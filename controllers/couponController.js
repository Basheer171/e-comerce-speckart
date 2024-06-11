const couponDb = require('../models/coupenModel');
const cartDb = require('../models/cartModel');
const userDb = require('../models/userModel');




// Load View Coupon
const loadViewCoupon = async(req, res)=>{
    try {
        const couponItems = await couponDb.find();
        res.render('view-coupon',{
            message:'View Coupons',
            couponItems,
            couponAdded:req.session.couponAdded,
        })
        
    } catch (error) {
        console.log(error);
    }
};


// Load Add Coupon Page
const loadAddCoupon = async(req, res)=>{
    try {

        res.render('add-coupon',{message:'Add Coupon'})
        
    } catch (error) {
        console.log(error);
    }
};


// Add Coupon
const AddCoupon = async(req, res)=>{
    try {
    
const {
    couponName,
    couponCode,
    discountAmount,
    validFrom,
    validTo,
    minimumSpend,
    usersLimit,
    description

}=req.body;

  if(discountAmount > minimumSpend){
    return res.json({ invalidPrice: true, message: 'discount amount cant be abouve the minimum spend' });
  }

// Check if coupon name is unique
const existingCouponName = await couponDb.findOne({ couponName: couponName });
if (existingCouponName) {
  return res.json({ success: false, message: 'Coupon name already exists' });
}

// Check if coupon code is unique
const existingCouponCode = await couponDb.findOne({ couponCode: couponCode });
if (existingCouponCode) {
  return res.json({ success: false, message: 'Coupon code already exists' });
}


    const coupon = new couponDb({
        couponName,
        couponCode,
        discountAmount,
        validFrom,
        validTo,
        minimumSpend,
        usersLimit,
        description
    });

    const result = await coupon.save();
    

    req.session.couponAdded = 1;
    return res.json({ success: true, message: 'Coupon added successfully' });



        
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

};

// Load Edit Coupon Page
const loadEditCoupon = async(req, res)=>{
    try {

        const couponId = req.query.id

        const couponData = await couponDb.findOne({_id:couponId});
       
        res.render('edit-coupon',{
            message:'Edit Coupon',
            couponData
        })
        
    } catch (error) {
        console.log(error);
    }
};

const editCoupon = async (req, res) => {
    try {
        const {
            couponName,
            couponCode,
            discountAmount,
            validFrom,
            validTo,
            minimumSpend,
            usersLimit,
            description
        } = req.body;

        // Ensure discount amount is not greater than minimum spend
        if (Number(discountAmount) > Number(minimumSpend)) {
            return res.json({ invalidPrice: true, message: 'Discount amount can\'t be above the minimum spend' });
        }

        // Check if coupon name is unique (excluding current coupon)
        const existingCouponName = await couponDb.findOne({
            couponName: couponName,
            _id: { $ne: req.query.id }
        });
        if (existingCouponName) {
            return res.json({ success: false, message: 'Coupon name already exists' });
        }

        // Check if coupon code is unique (excluding current coupon)
        const existingCouponCode = await couponDb.findOne({
            couponCode: couponCode,
            _id: { $ne: req.query.id }
        });
        if (existingCouponCode) {
            return res.json({ success: false, message: 'Coupon code already exists' });
        }

        // Update the coupon
        const updatedCoupon = await couponDb.findOneAndUpdate(
            { _id: req.query.id },
            {
                $set: {
                    couponName: couponName,
                    couponCode: couponCode,
                    discountAmount: discountAmount,
                    validFrom: validFrom,
                    validTo: validTo,
                    minimumSpend: minimumSpend,
                    usersLimit: usersLimit,
                    description: description
                }
            },
            { new: true } // Option to return the updated document
        );

        if (!updatedCoupon) {
            return res.json({ success: false, message: 'Coupon not found' });
        }

        res.json({ success: true, message: 'Coupon updated successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'An error occurred while updating the coupon' });
    }
};


// Delete Coupon by Admin
const deletecoupon = async(req, res)=>{
    try {
       

        const deleteCoupon = await couponDb.deleteOne({_id:req.query.id});
       

        res.redirect('/admin/view-coupon')


    } catch (error) {
        console.log(error);
    }
};

// ------------------------------------------------------- Coupon User Page Load --------------------------------------------------------------//
const couponUserPageLoad = async(req, res)=>{
    try {
        const userId = req.session.user_id;
        const userData = await userDb.findOne({_id:userId});
     
        // Get the current date
        const currentDate = new Date();

        // Fetch only the coupons that are still valid
        const couponData = await couponDb.find({status: true, validTo: { $gte: currentDate }});
        
        res.render('coupon', {
            user: userData,
            couponData,
        });
        
    } catch (error) {
        console.log(error);
    }
}





// --------------------------------- Function for applying coupon on the user side (Checkout Page) ------------------------------------------//
const applyCoupon = async(req, res)=>{

    try {
        const userId = req.session.user_id;
       
        const code = req.body.code         
      

        req.session.code=code;

        const amount = Number(req.body.amount);
       
        const cartData = await cartDb.findOne({user:userId}).populate('products.productId');
        

        let totalPrice=0;

        const userExist = await couponDb.findOne({ couponCode:code, usedUsers: {$in:[userId]} });
        
        if (cartData && cartData.products.length > 0) {
            const products = cartData.products;
            for (const product of products) {
                totalPrice += product.quantity * product.price;
            }
        }

        if (userExist) {
            res.json({ user: true });
        } else {
            const couponData = await couponDb.findOne({ couponCode: code });

            if (!couponData) {
                res.json({ invalid: true });
            } else {
                const currentDate = new Date();

                if (currentDate < couponData.validFrom || currentDate > couponData.validTo) {
                    res.json({ dateExpired: true });
                } else if (couponData.activationDate >= currentDate) {
                    res.json({ notActivated: true });
                } else if (couponData.minimumSpend > 0 && totalPrice < couponData.minimumSpend) {
                    res.json({ insufficientAmount: true });
                } else if (couponData.status === false) {
                    res.json({ status: true });
                } else {
                    const disAmount = couponData.discountAmount;
                    const disTotal = Math.round(totalPrice - disAmount);

                    req.session.Amount = disTotal;
                    const applied = await cartDb.updateOne(
                        { userId: userId },
                        { $set: { applied: 'applied' } });

                    res.json({ amountOkay: true, disAmount, disTotal });
                }
            }
        }



    } catch (error) {
        console.log(error);
        res.status(500).json({ error: true });
    }
}


// -----------------------------------------------------Delete Applied Coupon-----------------------------------------------------// 

const deleteAppliedCoupon = async(req, res)=>{
    try {

        const userId = req.session.userId
        const code = req.body.code;
        

        const couponData = await couponDb.findOne({couponCode:code})
        const amount = Number(req.body.amount);
        const disAmount = couponData.discountAmount;
        const disTotal = Math.round(amount + disAmount);

        const deletApplied = await cartDb.updateOne(
            {userId:userId},
            {$set:{applied:'not'}}
        );

        if(deletApplied){
            res.json({success:true, disTotal});
        }
        
    } catch (error) {
        console.log(error);
    }
};


module.exports={
    loadViewCoupon,
    loadAddCoupon,
    AddCoupon,
    loadEditCoupon,
    editCoupon,
    deletecoupon,
    applyCoupon,
    deleteAppliedCoupon,
    couponUserPageLoad
}