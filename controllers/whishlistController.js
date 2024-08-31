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
        const wishlist = await WishList.findOne({ user: req.session.user_id });
    
        if (wishlist) {
          const wishItem = [];
          for (const items of wishlist.products) {
            const productId = items.product;
    
            const productDetails = await Product.findById(productId, {
              _id: 1,
              image: 1,
              name: 1,
              category: 1,
              price: 1,
              qty:1
            });

            const item = { product: productDetails,};
            wishItem.push(item);
          }
    // console.log("wishItem",wishItem);
    
          res.render("wishlist", {
            user: req.session.user_id,
            currentPage: "shop",
            item: wishItem,
          });
        } else {
          res.render("wishlist", {
            user: req.session.user_id,
            currentPage: "shop",
            item: 0,
          });
        }
      } catch (error) {
        next(error);
      }
}
//=============================================== to remove wishList item ==============================================//

    const remove_wishItem = async (req, res, next) => {
        try {
            const { productId } = req.body;
            const wishList = await WishList.findOne({ user: req.session.user_id });
            wishList.products = wishList.products.filter(
                (wishitem) => wishitem.product.toString() !== productId.toString()
            );
    
            await wishList.save();
    
            res.json({ status: "remove" }); // Send a JSON response indicating the status
    
        } catch (error) {
            next(error);
        }
    };
    

module.exports = {
    load_whislist,
    addToWishlist,
    remove_wishItem
}