const Brand = require('../models/brandModel');

// View Brand
const viewBrand = async(req,res)=>{
    try {
        const brandData = await Brand.find(); // Fetch from database
        // console.log(brandData);

        res.render('view-brand',{message:'View Brand',brandData});
        
    } catch (error) {
        
    }
};

// AddbBrand Load
const addBrandLoad = async(req,res)=>{
    try {
        res.render('add-brand',{message:'Add Brand'})
        
    } catch (error) {
        console.log(error);
    }
};

// Add Brand
const addBrand = async(req,res)=>{
    try {

        const brand = new Brand({
            brandName:req.body.brandName,
            specification:req.body.specification,
            image:req.file.filename
        });
        const brandData = await brand.save();
        // console.log('Hello');
        if(brandData){
            res.redirect('/admin/view-brand');
        }else{
            res.render('add-brand');    
        }

        
    } catch (error) {
        console.log(error);
    }
};


// Edit Brand Load
const editBrandLoad = async(req,res)=>{
    try {
        const brand_id = req.query.id;
        // console.log(brand_id);
        const brandData = await Brand.findById({_id:brand_id});
        // console.log('Hello',brandData);
        if(brandData){
            res.render('edit-brand',{message:'Edit Brand',brandData});
        }else{
            res.redirect('/admin/view-brand');
        }

    } catch (error) {
        console.log(error);
    }
};

// Edit Brand
const editBrand = async(req,res)=>{
    try {
        const id= req.body.id;
        // console.log(brand_id);
        const brandData = await Brand.findByIdAndUpdate({_id:id},
            {$set:{
                brandName:req.body.brandName,
                specification:req.body.specification,
                image:req.file.filename,
                is_block:req.body.is_block
            }});
        // console.log('Hello',brandData);

        if(brandData){
            res.redirect('/admin/view-brand');
        }else{
            res.render('edit-brand');
        }

        
    } catch (error) {
        console.log(error);
    }
};

// Brand List/Unlist
const brandListorUnlist = async(req,res)=>{
    try {
        const brand_id = req.query.id;
        // console.log(brand_id);
        const brandData = await Brand.findById({_id:brand_id});
        // console.log('Hello',brandData);
        if(brandData.is_block===false){
            await Brand.updateOne({_id:brand_id},{$set:{is_block:true}});
            res.redirect('/admin/view-brand');

        }else{
            await Brand.updateOne({_id:brand_id},{$set:{is_block:false}});
            res.redirect('/admin/view-brand');
        }
        
    } catch (error) {
        console.log(error);
    }
}



module.exports = {
    viewBrand,
    addBrandLoad,
    addBrand,
    editBrandLoad,
    editBrand,
    editBrand,
    brandListorUnlist
}