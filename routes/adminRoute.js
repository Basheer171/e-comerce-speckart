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

const auth = require("../middleware/adminAuth");

const adminController = require("../controllers/adminController");
const categoryController = require("../controllers/categoryController");
const brandController = require("../controllers/brandController");
const productController = require("../controllers/productController");





admin_route.get('/',auth.isLogout,adminController.loadLogin);
admin_route.post('/',adminController.verifyLogin);

admin_route.get('/home',auth.isLogin,adminController.loadDashboard);

admin_route.get('/logout',auth.isLogin,adminController.logout);

// admin_route.get('/forget',auth.isLogout,adminController.forgetLoad);
// admin_route.post('/forget',adminController.forgetVerify);

// admin_route.get('/forget-password',adminController.forgetPasswordLoad);
// admin_route.post('/forget-password',adminController.resetPassword);

admin_route.get('/dashboard',auth.isLogin,adminController.adminDashboard);

admin_route.get('/new-user',auth.isLogin,adminController.newUserLoad);
admin_route.post('/new-user', adminController.addUser);
admin_route.get('/edit-user',auth.isLogin, adminController.editUserLoad);
admin_route.post('/edit-user',adminController.updateUsers);
admin_route.get('/delete-user',adminController.deleteUser);
admin_route.get('/view-users',auth.isLogin,adminController.viewUsers);
admin_route.get('/is_blockUser',adminController.userBlockorActive);


admin_route.get('/view-category',auth.isLogin,categoryController.viewCategory);
admin_route.get('/add-category',auth.isLogin,categoryController.addCategoryLoad);
admin_route.post('/add-category',upload.single('image'),categoryController.addCategory);
admin_route.get('/edit-category', auth.isLogin, categoryController.editCategoryLoad);
admin_route.post('/edit-category', upload.single('image'), categoryController.updateCategory);
admin_route.get('/is_blockCategory', auth.isLogin, categoryController.categoryListorUnlist);


admin_route.get('/view-brand',auth.isLogin,brandController.viewBrand);
admin_route.get('/add-brand',auth.isLogin,brandController.addBrandLoad);
admin_route.post('/add-brand', upload.single('image'),brandController.addBrand);
admin_route.get('/edit-brand',auth.isLogin,brandController.editBrandLoad);
admin_route.post('/edit-brand', upload.single('image'),brandController.editBrand);
admin_route.get('/is_blockBrand',auth.isLogin,brandController.brandListorUnlist);


admin_route.get('/view-product', auth.isLogin, productController.viewProduct);
admin_route.get('/add-product', auth.isLogin, productController.loadAddProduct);
admin_route.post('/add-product', upload.array('image',4),productController.addProduct);
admin_route.get('/edit-product', auth.isLogin, productController.editProductLoad);
admin_route.post('/edit-product', upload.array('image',4),productController.editProduct);
admin_route.get('/is_activeProduct', auth.isLogin, productController.productListorUnlist);



module.exports = admin_route;
