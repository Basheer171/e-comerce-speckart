const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');
const Offer = require('../models/offerModel')



// View Product page
const viewProduct = async (req, res) => {
    try {
        const product = await Product.find()
            .populate({ path: "category", populate: { path: "offer" } })
            .populate('brandName')
            .populate('offer');
        
        const availableOffers = await Offer.find({ status: true, expiryDate: { $gte: new Date() } });
        
        res.render('view-product', {
            title: 'Product Details',
            product,
            availableOffers
        });

    } catch (error) {
        console.log(error);
        res.render('500');
    }
};


// Load add Product
const loadAddProduct = async(req,res)=>{
    try {
       
        const category = await Category.find();  // Fetch data from database
        const brandData = await Brand.find();
        res.render('add-product',{message:'Add Product',category,brandData}); // passing category.

    } catch (error) {
        console.log(error);
    }
}


// Add Product
const addProduct = async(req,res)=>{
    try {

        const name=req.body.name;
        const category=req.body.category;
        const brandName=req.body.brandName;
        const price=req.body.price;
        const qty=req.body.qty;
        const description=req.body.description;

         
        const image = []
        for(i=0;i<req.files.length && i<4;i++){
            image[i] = req.files[i].filename;
            
        //     await sharp(path.join(__dirname,'../public/adminAssets/images',filename))
        //         .resize(300, 300)
        //         .toFile(path.join(__dirname,'../public/adminAssets/images', 'resized-'+filename));

        //     image[i]='resized-'+filename;
        }

        if(req.files.length>4){
            console.log("More than 4 images were uploaded. Only the first 4 will be processed.");
        }


        const newProduct = new Product({
            name:name,
            category:category,
            brandName:brandName,
            price:price,
            qty:qty,
            description:description,
            image:image
            
        });
        
        const productData = await newProduct.save();
        if (productData) {

            res.redirect('/admin/view-product')
        } else {

            res.render('/admin/add-product', { message: 'Something Wrong' });
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
}

// Edit product Load
const editProductLoad = async(req,res)=>{
    try {
        const id = req.query.id;
        const productData = await Product.findById({_id:id});
        // console.log(productData);
        const category = await Category.find();
        // console.log('/////',category);
        const brandData = await Brand.find();
        res.render('edit-product',{message:'Edit Product',productData,category,brandData});
    } catch (error) {
        console.log(error);
    }
}


// Edit Product
const editProduct = async(req,res)=>{
    try {
        const id = req.body.id;
        const productName = req.body.productName;  
        const categoryName = req.body.category;   
        const brandName = req.body.brand;         
        const qty = req.body.qty;
        const description = req.body.description;
        const price = req.body.price;
        const image = [];

        for(i=0;i<req.files.length;i++){
            image[i] = req.files[i].filename;
        }

        const updatedData = await Product.findByIdAndUpdate({_id:id},
            {$set:{
                name: productName,          
                category: categoryName,     
                brandName: brandName,      
                qty: qty,
                description: description,
                price: price,
                image: image,
                is_active: req.body.is_active
            }});

        if(updatedData){
            res.redirect('/admin/view-product');
        } else {
            res.render('edit-product', { message: 'Something went wrong' });
        }
    } catch (error) {
        console.log(error);
    }
}

// Product List/Unlist
const productListorUnlist = async(req,res)=>{
    try {

        const id = req.query.id;
        // console.log(id);
        const productData = await Product.findById({_id:id});
        // console.log(productData);

        if(productData.is_active===true){
            await Product.updateOne({_id:id},{$set:{is_active:false}});
            
            res.redirect('/admin/view-product');
        }else{
            await Product.updateOne({_id:id},{$set:{is_active:true}});
            
            res.redirect('/admin/view-product');
        }


    } catch (error) {
        console.log(error);
    }
}


const loadProductPageLoad = async (req,res)=>{
    try {
      const productID = req.query.id;
      
      let product=await Product.findOne({_id:productID}).populate('offer');
    //   console.log('product',product);
      res.render('product',{
        product:product,
        user:req.session.user_id, 
      })
    

    } catch (error) {
        
        console.log(error);
    }
}

 // ---------------------------------------- Apply Product Offer ------------------------------------------------//
 const applyProductOffer = async(req, res)=>{
    try {
        const { offerId, productId } = req.body;

        const offerData = await Offer.findOne({ _id: offerId });

        if(!offerData){
            return res.json({status:false,message:"Offer not found"});
        };

        const productData = await Product.findOne({_id:productId}).populate('category');


        if(!productData){
            return res.json({status:false,message:"Product not found"});
        };

        // Get the category discount, if available
        const categoryDiscount = productData.category && productData.category.offer ? await Offer.findOne({_id:productData.category.offer}):0;

        // Calculate real price and discounted price for the product
        const discountPercentage = offerData.percentage;
        const originalPrice = parseFloat(productData.price);
        const discountedPrice = originalPrice-(originalPrice*discountPercentage)/100;

        // Check if category offer is available and its discount is greater than product offer
        if(categoryDiscount && categoryDiscount.percentage > discountPercentage){
            return res.json({status:false, message: 'Category offer has greater discount'});
        }

        await Product.updateOne({_id:productId},
            {
                $set:{
                    offer:offerId,
                    discountedPrice:discountedPrice
                }
            });
        
            const updatedProduct = await Product.findOne({_id:productId}).populate('offer')
            res.json({status:true})

    } catch (error) {
        console.error(error);
        res.render('500')
    }
  }


  // ------------------------------- Remove Product Offer -------------------------------------------//
  const removeProductOffer = async(req, res)=>{
    try {

        const {productId}=req.body;

        const updatedProductData = await Product.updateOne({_id:productId},
            {$unset:{
                offer:"",
                discountedPrice:""

            }});

            return res.json({status:true});

        
    } catch (error) {
        console.error(error);
        res.render('500')
    }
  }
module.exports = {
    
    viewProduct,
    loadAddProduct,
    addProduct,
    editProductLoad,
    editProduct,
    productListorUnlist,
    loadProductPageLoad,
    applyProductOffer,
    removeProductOffer
}   