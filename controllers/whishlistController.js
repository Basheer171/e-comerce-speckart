const WishList = require("../models/whishlistModel");
const Product = require("../models/productModel")

const addToWishlist = async (req, res, next) => {
    try {
        const { productId } = req.body;
        const userWishList = await WishList.findOne({ user: req.session.user_id });
    
        if (!userWishList) {
            const newWishList = new WishList({
                user: req.session.user_id,
                products: [{ product: productId }],
            });

            await newWishList.save();
            res.json({ success: true, message: 'Item added to wishlist' });
        } else {
            const wishedAlready = userWishList.products.find(
                (item) => item.product == productId
            );

            if (wishedAlready) {
                // If the product is already in the wishlist
                res.json({ success: false, alreadyInWishlist: true, message: 'Product is already in the Wishlist' });
            } else {
                userWishList.products.push({ product: productId });
                await userWishList.save();
                res.json({ success: true, message: 'Item added to wishlist' });
            }
        }
    } catch (error) {
        next(error);
    }
}


const load_whislist = async(req,res, next)=>{
    try {
        res.render("wishlist")
    } catch (error) {
        next(error)
    }
}

module.exports = {
    load_whislist,
    addToWishlist
}