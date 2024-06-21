const User = require("../models/userModel");
const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const config = require("../config/config");
const nodemailer = require("nodemailer");
const orderDb = require('../models/orderModels')
const productDb = require('../models/productModel');
const Admin = require('../models/adminModel')


//adding secure password bcrypt

const securePassword = async (password) => {

    try {

        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;

    } catch (error) {
        console.log(error.message);

    }

}



//for send mail 
const addUserMail = async (name, email, password, user_id) => {

    try {

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword
            }
        });

        const mailOptions = {
            from: config.emailUser,
            to: email,
            subject: 'Admin add you and Verify your mail',
            html: '<p>Hii ' + name + ', please click here to <a href="http://127.0.0.1:3000/verify?id=' + user_id + '"> verify </a> your mail.</p> <br><br> <b>Email:-</b>' + email + '<br><b>password:-</b>' + password + ''
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log("Email has been sent:- ", info.response);
            }
        })

    } catch (error) {
        console.log(error.message);
    }
}

//load login

const loadLogin = async (req, res) => {
    try {

        res.render('login');   
    } catch (error) {
        console.log(error.message);
    }
}

// verify login

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const adminData = await Admin.findOne({ email: email });
        // console.log("userdata",userData);
        if (adminData) {
            const passwordMatch = await bcrypt.compare(password, adminData.password);
            // console.log("password",passwordMatch);
            if (passwordMatch) {
                    req.session.user_id = adminData._id;
                    res.redirect("/admin/home");
            } else {
                res.render('login', { message: "Email and password are incorrect." });
            }
        } else {
            res.render('login', { message: "Email and password are incorrect." });
        }
    } catch (error) {
        console.log(error.message);
    }
};


// dashboard for user details

const loadDashboard = async (req, res) => {
    try {
        const adminData = await Admin.findById({ _id: req.session.user_id });

        if (!adminData) {
            // If adminData is not found, render a 404 page
            res.render('login',) // Assuming '404' is the name of your 404 page template
            return;
        }

        res.render('home');
    } catch (error) {  
        console.error(error.message);
        // Render a 500 error page if an unexpected error occurs
        res.status(500).render('500'); // Assuming '500' is the name of your 500 error page template
    }
};

//logout in admin home 

const logout = async (req, res) => {

    try {

        req.session.destroy();
        res.redirect('/admin');

    } catch (error) {
        console.log(error.message);
    }
}

// //admin forget password load

// const forgetLoad = async (req, res) => {
//     try {

//         res.render('forget');

//     } catch (error) {
//         console.log(error.message);
//     }
// }



// // forget verified
// const forgetVerify = async (req, res) => {
//     try {
//         const email = req.body.email;
//         const userData = await User.findOne({ email: email });

//         if (userData) {
//             if (userData.is_admin === 0) {
//                 res.render('forget', { message: 'Email is incorrect' });
//             } else {
//                 const randomString = randomstring.generate();
//                 const updatedData = await User.updateOne({ email: email }, { $set: { token: randomString } });
//                 sendResetPasswordMail(userData.name, userData.email, randomString);
//                 return res.render('forget', { message: 'Please check your email to reset password.' });
//             }
//         } else {
//             res.render('forget', { message: 'Email is incorrect' });
//         }
//     } catch (error) {
//         console.log(error.message);
//     }
// };


// //forget password load

// const forgetPasswordLoad = async (req, res) => {
//     try {

//         const token = req.query.token;

//         const tokenData = User.findOne({ token: token });
//         if (tokenData) {
//             res.render('forget-password', { user_id: tokenData._id });
//         } else {
//             res.render('404', { message: "Invalid Link" });
//         }

//     } catch (error) {
//         console.log(error.message);
//     }
// }

// const resetPassword = async (req, res) => {

//     try {

//         const password = req.body.password;
//         const user_id = req.body.user_id;

//         const securePass = await securePassword(password);
//         const updatedData = await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: securePass, token: '' } });

//         res.redirect('/admin');

//     } catch (error) {
//         console.log(error.message);
//     }
// }

//admin dashboard user details

const adminDashboard = async (req, res) => {

    try {
        const userData = await User.find({ is_admin: 0 });
        res.render('dashboard', { users: userData });

    } catch (error) {
        console.log(error.message);
    }

}

//* Add New Work start

const newUserLoad = async (req, res) => {
    try {

        res.render('new-user');

    } catch (error) {
        console.log(error.message);
    }
}

const addUser = async (req, res) => {
    try {

        const name = req.body.name;
        const email = req.body.email;
        const mobile = req.body.mno;
        // const image = req.file.filename;
        const password = randomstring.generate(8);

        const spassword = await securePassword(password)

        const user = new User({
            name: name,
            email: email,
            mobile: mobile,
            // image: image,
            password: spassword,
            is_admin: 0
        });

        const userData = await user.save();

        if (userData) {
            addUserMail(name, email, password, user._id);
            res.redirect('/admin/dashboard');
        }
        else {
            res.render('new-user', { message: 'Something wrong.' });
        }

    } catch (error) {
        console.log(error.message);
    }
}

//edit user functionality

const editUserLoad = async (req, res) => {

    try {
        const id = req.query.id;
        const userData = await User.findById({ _id: id });
        if (userData) {
            res.render('edit-user', { user: userData });
        }
        else {
            res.redirect('/admin/dashboard');
        }


    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
}

const updateUsers = async (req, res) => {
    try {

        const userData = await User.findByIdAndUpdate({ _id: req.body.id }, { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mno, is_verified: req.body.verify } });

        res.redirect('/admin/dashboard');

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
}

//delete users

const deleteUser = async (req, res) => {
    try {

        const id = req.query.id;
        await User.deleteOne({ _id: id });
        res.redirect('/admin/dashboard');

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
}

// View Users in Admin Dashboard
const viewUsers = async (req, res) => {
    try {

        const userData = await User.find({});
        res.render('view-users', { message: 'View Users', userData })

    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }

};


// Edit User Load
const userBlockorActive = async (req, res) => {
    try {

        const user_id = req.query.id;
        // console.log(user_id);
        const userData = await User.findById({ _id: user_id });
        //    console.log(userData);
        if (userData.is_block === true) {

            await User.updateOne({ _id: user_id }, { $set: { is_block: false } });
            if (req.session.user_id === user_id) {
                req.session.user_id = null;
            }
            res.redirect('/admin/view-users')

        } else {
            await User.updateOne({ _id: user_id }, { $set: { is_block: true } });
            res.redirect('/admin/view-users');
        }


    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
};

// Load View Orders Page
const loadViewOrders = async (req, res) => {
    try {
        const orderData = await orderDb.find().populate('products').sort({date:-1})
        const productsArray = [];
        for (let order of orderData) {
            for (let productValue of order.products) {
                const productId = productValue.productId;
                const productData = await productDb.findById(productId);
                const userDetails = await User.findOne({ firstName: order.userName });
        
                if (productData) {
                    productsArray.push({
                        user: userDetails,
                        product: productData,
                        orderDetails: {
                            _id: order._id,
                            userId: order.userId,
                            deliveryDetails: order.deliveryDetails,
                            date: order.date,
                            totalAmount: productValue.quantity * order.totalAmount,
                            orderStatus: productValue.orderStatus,
                            paymentStatus: productValue.paymentStatus,
                            statusLevel: productValue.statusLevel,
                            paymentMethod: order.paymentMethod,
                            quantity: productValue.quantity,
                        },
                    });
                }
            }
        }

        // console.log("productsArray",productsArray);
    
        res.render('view-orders', {
            message: 'View Orders',
            orders: productsArray,
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('500', {
            title: '500',
        });
    }
};

const viewOrderDetails = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const productId = req.query.productId;

        if (!orderId || !productId) {
            return res.status(400).send("orderId and productId are required");
        }

        // Fetch order details from the database
        const orderDetails = await orderDb.findById(orderId);
        if (!orderDetails) {
            return res.status(404).send('Order not found.');
        }

        // Fetch product details from the database
        const productData = await productDb.findById(productId);
        if (!productData) {
            return res.status(404).send('Product not found.');
        }

        // Find the specific product details within the order
        const productDetails = orderDetails.products.find(product => product.productId.toString() === productId);
        if (!productDetails) {
            return res.status(404).send('Product not found in order.');
        }

        let paymentStatus = productDetails.paymentStatus; // Default to existing payment status
        // console.log("paymentStatus",paymentStatus);
        if (productDetails.orderStatus === 'Delivered') {
            paymentStatus = 'success';
        }else{
            paymentStatus = "Pending"
        }
        // console.log("paymentStatus",paymentStatus);

        // Prepare data to pass to the template
        const productOrder = {
            orderId: orderDetails._id,
            product: productData,
            _id: productDetails._id,
            orderStatus: productDetails.orderStatus,
            statusLevel: productDetails.statusLevel,
            paymentStatus: paymentStatus,
            totalAmount: orderDetails.totalAmount,
            quantity: productDetails.quantity,
            paymentMethod: orderDetails.paymentMethod,
            deliveryDetails: orderDetails.deliveryDetails,
            date: orderDetails.date,
        };

        // Render the view-ordersDetails EJS template with the data
        res.render('view-ordersDetails', {
            message: 'View Order Details',
            products: productOrder,
            orderId,
            productId,
        });

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};



const changeOrderStatus = async (req, res) => {
    try {
        const { status, orderId, productId } = req.body;

        // Find the order details in the database
        const orderDetails = await orderDb.findById(orderId);
        if (!orderDetails) {
            return res.status(404).send('Order not found.');
        }

        // Define status mapping and payment status mapping
        const statusMap = {
            Shipped: 2,
            OutforDelivery: 3,
            Delivered: 4,
        };

        const paymentStatusMap = {
            Delivered: 'Complete',
        };

        // Determine the status level based on selected status
        const selectedStatus = status;
        const statusLevel = statusMap[selectedStatus];
        // Find the product details within the order
        const productDetails = orderDetails.products.find(product => product.productId.toString() === productId);
        if (!productDetails) {
            return res.status(404).send('Product not found in order.');
        }

        // Update product details with new status
        productDetails.statusLevel = statusLevel;
        productDetails.orderStatus = status;
        productDetails.updatedAt = Date.now();

        // Update payment status if the order is delivered
        if (selectedStatus === 'Delivered') {
            orderDetails.products[0].paymentStatus = paymentStatusMap[selectedStatus];
        }
        // Save the updated order details
        const result = await orderDetails.save();
        // console.log("result",result);

        // Redirect back to view-ordersDetails page with orderId and productId
        res.redirect(`/admin/view-ordersDetails?orderId=${orderId}&productId=${productId}`);

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};







module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    // forgetLoad,
    // forgetVerify,
    // forgetPasswordLoad,
    // resetPassword,
    adminDashboard,
    newUserLoad,
    addUser,
    editUserLoad,
    updateUsers,
    deleteUser,
    viewUsers,
    userBlockorActive,
    loadViewOrders,
    viewOrderDetails,
    changeOrderStatus
}