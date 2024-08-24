const express = require("express");
const admin_route = express();

const admiauth = require("../middleware/adminAuth");

const adminController = require("../controllers/adminController");
const categoryController = require("../controllers/categoryController");
const brandController = require("../controllers/brandController");
const productController = require("../controllers/productController");
const couponController = require("../controllers/couponController");
const offerController = require("../controllers/offerController")
const upload = require('../middleware/fileUpload')

admin_route.use(express.json());
admin_route.use(express.urlencoded({extended:true}));
admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');



admin_route.use('/public',express.static('public'));







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
admin_route.post('/view-ordersDetails/changeStatus',adminController.changeOrderStatus);


admin_route.get('/view-coupon', admiauth.isLogin, couponController.loadViewCoupon);
admin_route.get('/add-coupon', admiauth.isLogin, couponController.loadAddCoupon);
admin_route.post('/add-coupon', couponController.AddCoupon);
admin_route.get('/edit-coupon', admiauth.isLogin, couponController.loadEditCoupon);
admin_route.post('/edit-coupon', couponController.editCoupon);
admin_route.get('/delete-coupon', admiauth.isLogin, couponController.deletecoupon);

admin_route.get('/view-offers', admiauth.isLogin, offerController.loadViewOffer);
admin_route.get('/add-offer', admiauth.isLogin, offerController.loadAddOffer);
admin_route.post('/add-offer', admiauth.isLogin, offerController.addOffer);
admin_route.get('/edit-offer',admiauth.isLogin, offerController.loadEditOffer);
admin_route.post('/edit-offer',admiauth.isLogin, offerController.editOffer);
admin_route.patch('/cancelOffer',admiauth.isLogin, offerController.cancelOffer);

admin_route.patch('/applyOffer',admiauth.isLogin, categoryController.applyCategoryOffer);
admin_route.patch('/removeOffer', admiauth.isLogin, categoryController.removeCategoryOffer);

admin_route.patch('/applyProductOffer',admiauth.isLogin, productController.applyProductOffer);
admin_route.patch('/removeProductOffer', admiauth.isLogin, productController.removeProductOffer);



module.exports = admin_route;
