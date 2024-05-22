const express = require("express");
const admin_route = express();

const session = require("express-session");
const config = require("../config/config");
admin_route.use(session({secret:config.sessionSecret,resave: false,saveUninitialized: true,}));

const bodyParser = require("body-parser");
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

const multer = require("multer");
const path = require("path");

admin_route.use('/public',express.static('public'));

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname, '../public/userImages'));
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname;
        cb(null,name);
    }
});

const upload = multer({
    storage:storage,
    fileFilter:(req,file,cb)=>{
        if(file.mimetype==="image/png"||
            file.mimetype==="image/jpg"||
            file.mimetype==="image/jpeg"||
            file.mimetype==="image/webp"||
            file.mimetype==="image/avif"
        ){
            cb(null,true)
        }else{
            cb(null,false);
            return cb(new Error("Only .png, .jpg, .jpeg, .webp format allowed."));
        }
    }
});

const admiauth = require("../middleware/adminAuth");

const adminController = require("../controllers/adminController");
const categoryController = require("../controllers/categoryController");
const brandController = require("../controllers/brandController");
const productController = require("../controllers/productController");
const orderController = require ("../controllers/orderController");
const couponController = require("../controllers/couponController");





admin_route.get('/',admiauth.isLogout,adminController.loadLogin);
admin_route.post('/',adminController.verifyLogin);

admin_route.get('/home',admiauth.isLogin,adminController.loadDashboard);

admin_route.get('/logout',admiauth.isLogin,adminController.logout);

// admin_route.get('/forget',auth.isLogout,adminController.forgetLoad);
// admin_route.post('/forget',adminController.forgetVerify);

// admin_route.get('/forget-password',adminController.forgetPasswordLoad);
// admin_route.post('/forget-password',adminController.resetPassword);

admin_route.get('/dashboard',admiauth.isLogin,adminController.adminDashboard);

admin_route.get('/new-user',admiauth.isLogin,adminController.newUserLoad);
admin_route.post('/new-user', adminController.addUser);
admin_route.get('/edit-user',admiauth.isLogin, adminController.editUserLoad);
admin_route.post('/edit-user',adminController.updateUsers);
admin_route.get('/delete-user',adminController.deleteUser);
admin_route.get('/view-users',admiauth.isLogin,adminController.viewUsers);
admin_route.get('/is_blockUser',adminController.userBlockorActive);


admin_route.get('/view-category',admiauth.isLogin,categoryController.viewCategory);
admin_route.get('/add-category',admiauth.isLogin,categoryController.addCategoryLoad);
admin_route.post('/add-category',upload.single('image'),categoryController.addCategory);
admin_route.get('/edit-category', admiauth.isLogin, categoryController.editCategoryLoad);
admin_route.post('/edit-category', upload.single('image'), categoryController.updateCategory);
admin_route.get('/is_blockCategory', admiauth.isLogin, categoryController.categoryListorUnlist);


admin_route.get('/view-brand',admiauth.isLogin,brandController.viewBrand);
admin_route.get('/add-brand',admiauth.isLogin,brandController.addBrandLoad);
admin_route.post('/add-brand', upload.single('image'),brandController.addBrand);
admin_route.get('/edit-brand',admiauth.isLogin,brandController.editBrandLoad);
admin_route.post('/edit-brand', upload.single('image'),brandController.editBrand);
admin_route.get('/is_blockBrand',admiauth.isLogin,brandController.brandListorUnlist);


admin_route.get('/view-product', admiauth.isLogin, productController.viewProduct);
admin_route.get('/add-product', admiauth.isLogin, productController.loadAddProduct);
admin_route.post('/add-product', upload.array('image',4),productController.addProduct);
admin_route.get('/edit-product', admiauth.isLogin, productController.editProductLoad);
admin_route.post('/edit-product', upload.array('image',4),productController.editProduct);
admin_route.get('/is_activeProduct', admiauth.isLogin, productController.productListorUnlist);



admin_route.get('/view-orders', admiauth.isLogin, adminController.loadViewOrders);
admin_route.get('/view-ordersDetails', admiauth.isLogin, adminController.viewOrderDetails);
admin_route.post('/view-ordersDetails/changeStatus',adminController.changeOrderStatus)

admin_route.get('/view-coupon', admiauth.isLogin, couponController.loadViewCoupon);
admin_route.get('/add-coupon', admiauth.isLogin, couponController.loadAddCoupon);
admin_route.post('/add-coupon', couponController.AddCoupon);
admin_route.get('/edit-coupon', admiauth.isLogin, couponController.loadEditCoupon);
admin_route.post('/edit-coupon', couponController.editCoupon);
admin_route.get('/delete-coupon', admiauth.isLogin, couponController.deletecoupon);




module.exports = admin_route;
