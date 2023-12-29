
const cartDb = require('../models/cartModel');
const userDb = require('../models/userModel');
const productDb = require('../models/productModel');

const { ObjectId } = require('mongoose').Types



const addToCart = async (req, res) => {
    try {
        const { user_id } = req.session;

        if (!user_id) {
            return res.json({ loginRequired: true });
        }

        const { id: productId } = req.body;
        const { _id: userId } = await userDb.findById(user_id);


        // Check if the product is already in the cart
        const cartData = await cartDb.findOne({ user: userId, 'products.productId': productId });

        if (cartData) { 
            // Product is already in the cart
            return res.json({ alreadyInCart: true });
        }

        const productData = await productDb.findById(productId);
        // console.log('productData',productData);
        if (!productData) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const update = {
            $addToSet: {
                products: {
                    productId,
                    price: productData.price,
                    quantity: 1,
                    totalPrice: productData.price,
                },
            },
        };

        const options = { upsert: true, new: true, setDefaultsOnInsert: true };
        await cartDb.findOneAndUpdate({ user: userId }, update, options);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
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
  const cartQuantity = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.body.product;
        // console.log('productId',productId);
        const count = parseInt(req.body.count);

        const cartData = await cartDb.findOne({ user: userId }).populate("products.productId");
// console.log('cartData',cartData);
        const productToUpdate = cartData.products.find(product => product.productId.equals(productId));
        // console.log('productToUpdate',productToUpdate);

        if (!productToUpdate) {
            return res.json({ changeSuccess: false, message: 'Product not found in the cart' });
        }

        const stockAvailable = await productDb.findById({ _id: productId });

        if (stockAvailable.qty < productToUpdate.quantity + count) {
            return res.json({ changeSuccess: false, message: 'Insufficient stock' });
        }

        // Update the quantity and calculate the new total price
        productToUpdate.quantity += count;
        productToUpdate.totalPrice = productToUpdate.price * productToUpdate.quantity;

        // Save the updated cart
        await cartData.save();

        res.json({ changeSuccess: true, updatedQuantity: productToUpdate.quantity });
    } catch (error) {
        console.log(error);
        res.json({ changeSuccess: false, message: 'An error occurred' });
    }
};

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
