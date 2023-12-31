
const cartDb = require('../models/cartModel');
const userDb = require('../models/userModel');
const productDb = require('../models/productModel');

const { ObjectId } = require('mongoose').Types



const addToCart = async (req, res) => {
    try {
        if (req.session.user_id) {
            const productId = req.body.id;
            const name = req.session.user_id;

            const userData = await userDb.findOne({ _id: name });
            const userId = userData._id;

            const productData = await productDb.findById({ _id: productId });

            const userCart = await cartDb.findOne({ user: userId });

            if (userCart) {
                const productExist = userCart.products.some(product => product.productId.equals(productId));

                if (productExist) {
                    // Product is already in the cart
                    res.json({ alreadyInCart: true });
                } else {
                    // Product is not in the cart, add it
                    await cartDb.findOneAndUpdate({ user: userId }, { $push: { products: { productId: productId, price: productData.price } } });
                    res.json({ success: true });
                }
            } else {
                // User has no cart, create a new one
                const data = new cartDb({ user: userId, products: [{ productId: productId, price: productData.price }] });
                const result = await data.save();
                res.json({ success: true });
            }
        } else {
            // User not logged in
            res.json({ loginRequired: true });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred' });
    }
};


const loadCart = async (req, res) => {
    try {
        const id = req.session.user_id;
        const userData = await userDb.findById({ _id: id });
        const userId = userData._id;

        const cartData = await cartDb.findOne({ user: userId }).populate("products.productId");
        if (req.session.user_id) {
            if (cartData && cartData.products.length > 0) {
                
                const Total = cartData.products.reduce((acc, product) => {
                    return acc + product.price * product.quantity;
                }, 0);

                res.render('cart', { user: userId, cart: cartData, Total });
            } else {
                res.render('cart', { user: userId, cart: [], Total: 0 });
            }
        } else {
            res.redirect('/login'); // Redirect to a login page
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).render('error', { error: 'An error occurred' });
    }
};



    // Cart Quantity
    const cartQuantity = async(req, res)=>{
        try {
            const userId = req.session.user_id;
            const productId = req.body.product;
            // console.log('product id',productId);
            // console.log('product id',userId);

            const count = parseInt(req.body.count);
            // console.log('Count',count);

            const cartData = await cartDb.findOne({ user: userId }).populate("products.productId");
                
            //  console.log("cartData",cartData);
            const [{quantity:quantity}]=cartData.products;
            // console.log('Quantity:', quantity);


            const stockAvailable = await productDb.findById({_id:productId})
            // console.log('stock Available',stockAvailable);

            if(stockAvailable.qty < quantity + count){
                return res.json({changeSuccess:false, message:'Insufficient stock'});

            }else{

                await cartDb.updateOne({user:userId,"products.productId":productId},
                {$inc:{"products.$.quantity":count}});
                res.json({changeSuccess:true}); 
            }
            
            const updateCartData = await cartDb.findOne({user:userId});
            // console.log('updateCartData',updateCartData);
            const updatedProduct = updateCartData.products.find((product)=>product.productId==productId);
            // console.log('updatedProduct', updatedProduct);

            const updatedQuantity = updatedProduct.quantity
            // console.log('updateedquantity',updatedQuantity);
            const productPrice = stockAvailable.price;
            // console.log('Product Price',productPrice);
            const productTotal = productPrice*updatedQuantity
            // console.log('Product Total', productTotal);
             

            const updateTotalProduct = await cartDb.updateOne({user:userId,"products.productId":productId},
            {$set:{"products.$.totalPrice":productTotal}})

            // console.log('productTotal',productTotal);

        } catch (error) {
            console.log(error);
            res.json({changeSuccess:false, message:'An error occurred'});
        }
    }

    // Cart Remove
const removeProduct = async(req,res)=>{
    try {
        const productId = req.body.product;
        // console.log('product Id',productId);
        const userid= req.session.user_id;
       
        // console.log('userId',userid);

        const cartData = await cartDb.findOneAndUpdate({ user: userid, "products.productId": productId },
                                                       { $pull: { products: { productId: productId } } });
        
        // console.log('cartData',cartData);

        if (cartData) {
            res.json({ success: true, cartData: cartData.products });
        } else {
            res.json({ success: false });
        }
        
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    addToCart,
    loadCart,
    cartQuantity,
    removeProduct

}
