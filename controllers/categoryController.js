const { default: mongoose } = require('mongoose');  
const Category = require('../models/categoryModel');
const Offer = require('../models/offerModel');
const Product = require('../models/productModel');
const path = require('path');
const sharp = require('sharp');

// View Category Dashboard
const viewCategory = async (req, res) => {
    try {
        const categoryData = await Category.find({}).populate('offer').exec();
        console.log("categoryData",categoryData)
        const availableOffers = await Offer.find({ status: true, expiryDate: { $gte: new Date() } });
        if(categoryData)

        res.render('view-category', {
            title: 'View Category',
            categoryData,
            availableOffers
        });

    } catch (error) {
        console.log(error);
        res.render('500');
    }
}


// Add new category Load
const addCategoryLoad = async (req, res) => {
    try {

        res.render('add-category', { message: 'Add Category' })

    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
};

// Add new category
const addCategory = async (req, res) => {
    try {
      const categoryName = req.body.categoryName;
      const description = req.body.description;
      const images = '';
  
      if (req.file) {
        const filename = req.file.filename;

        // Resize image to 300x300 pixels
        await sharp(path.join(__dirname, '../public/userImages', filename))
            .resize(300, 300)
            .toFile(path.join(__dirname, '../public/userImages', 'resized-' + filename));

        images = 'resized-' + filename;
    }
    const existCategory = await Category.findOne({categoryName:categoryName});
    if(existCategory){
        res.render('add-category',{
            message:'Category already existing',
            title:'add-category'
        })
    }else{

        const category = new Category({
            categoryName: categoryName,
            description: description,
            image: images
    });

    const categoryData = await category.save();

    res.redirect('/admin/view-category');
}
    

} catch (error) {
    console.log(error);
    res.render('500')
}
  };
  
  



// Edit Category Load
const editCategoryLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const categoryData = await Category.findById({ _id: id });

        if (categoryData) {
            res.render('edit-category', { message: 'Edit Category', categoryData });
        } else {
            res.redirect('/admin/view-category');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
}

// Update Category
const updateCategory = async (req, res) => {
    try {
        const id = req.body.id;
        let images = '';

        if (req.file) {
            const filename = req.file.filename;

            // Resize image to 300x300 pixels
            await sharp(path.join(__dirname, '../public/userImages', filename))
                .resize(300, 300)
                .toFile(path.join(__dirname, '../public/userImages', 'resized-' + filename));

            images = 'resized-' + filename;
        } else {
            // No new files uploaded, maintain existing image
            const existingCategory = await Category.findOne({ _id: id });

            if (existingCategory && existingCategory.image) {
                // If there is an existing image, use it
                images = existingCategory.image;
            }
            
        }

        const categoryData = await Category.findByIdAndUpdate(
            { _id: id },
            {
                $set: {
                    categoryName: req.body.category,
                    description: req.body.description,
                    image: images, 
                    is_block: req.body.is_block,
                },
            }
        );

        if (categoryData) {
            res.redirect('/admin/view-category');
        } else {
            res.render('edit-category');
        }
    } catch (error) {
        console.log(error);
        res.status(500).render('500');
    }
};

// Category List/Unlist
const categoryListorUnlist = async (req, res) => {
    try {
        const id = req.query.id;
        // console.log(id);
        const categoryData = await Category.findById({ _id: id });
        // console.log(categoryData);
        if (categoryData.is_block === true) {
            await Category.updateOne({ _id: id }, { $set: { is_block: false } });
            // console.log('Blocked');
            res.redirect('/admin/view-category');
        } else {

            await Category.updateOne({ _id: id }, { $set: { is_block: true } });
            res.redirect('/admin/view-category');
        };



    } catch (error) {
        console.log(error);
    }
}


const applyCategoryOffer = async (req, res) => {
    try {
            const { offerId, categoryId } = req.body;

        const offerData = await Offer.findOne({ _id: offerId });
        // console.log("offerData",offerData);
        if (!offerData) {
            return res.json({ status: false, message: 'Offer not found' });
        }
        const categoryData = await Category.findOneAndUpdate(
            { _id: categoryId },
            { $set: { offer: offerId } },
            { new: true }
        );

        if (!categoryData) {
            return res.json({ status: false, message: 'Category not found' });
        }

        const updatedProduct = await Product.updateMany(
            { category: categoryId },
            [
                {
                    $set: {
                        categoryOffer: new mongoose.Types.ObjectId(offerId),
                        categoryDiscountedPrice: {
                            $subtract: [
                                "$price",
                                {
                                    $divide: [
                                        { $multiply: ["$price", offerData.percentage] },
                                        100,
                                    ],
                                },
                            ],
                        },
                    },
                },
            ],
            { new: true, lean: true }
        );
        if (updatedProduct) {
            res.json({ status: true });
        } else {
            return res.json({ status: false, message: 'Failed to update products' });
        }


    } catch (error) {
        console.log(error);
        res.status(500).render('500');
    }
};

// ------------------------------------- Remove Apply Offer -------------------------------------------//Address

const removeCategoryOffer = async (req, res) => {
    try {
        const { categoryId } = req.body;

        const categoryData = await Category.findOne({ _id: categoryId });

        if (!categoryData) {
            return res.json({ status: false, message: 'Category not found' });
        }

        if (categoryData.offer) {
            const updateCategory = await Category.updateOne(
                { _id: categoryId },
                {
                    $unset: {
                        offer: ""
                    }
                }
            );
            const updatedProduct = await Product.updateOne(
                { category: categoryId },
                {
                    $unset: {
                        categoryOffer: "",
                        categoryDiscountedPrice: ""
                    }
                }
            );
            return res.json({status:true});
        }else{

            return res.json({status:false, message: "Offer field does not exist in the category",});

        };
    } catch (error) {
        console.log(error);
        res.status(500).render('500');
    }
}



module.exports = {
    viewCategory,
    addCategoryLoad,
    addCategory,
    editCategoryLoad,
    updateCategory,
    categoryListorUnlist,
    applyCategoryOffer,
    removeCategoryOffer

}