const User = require("../models/userModel");
const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const config = require("../config/config");
const nodemailer = require("nodemailer");
const orderDb = require('../models/orderModels')
const productDb = require('../models/productModel');
const Admin = require('../models/adminModel')


const {
    findIncome,
    countSales,
    findSalesData,
    findSalesDataOfYear,
    findSalesDataOfDay,
    findSalesDataOfMonth,
    formatNum,
    getTopSellingProducts,
    getTopSellingCategories,
    getTopSellingBrands
  } = require("../helpers/orderHelper");
  
  // =======================================================rendering the admin home================================================================
  
  const loadDashboard = async (req, res) => {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      // console.log("firstDayOfMonth",firstDayOfMonth)
      const firstDayOfPreviousMonth = new Date(today.getFullYear(),today.getMonth() - 1,1); 
      // console.log("firstDayOfPreviousMonth",firstDayOfPreviousMonth);
      

      const jan1OfTheYear = new Date(today.getFullYear(), 0, 1);
  
      const totalIncome = await findIncome();
      const thisMonthIncome = await findIncome(firstDayOfMonth);
      const thisYearIncome = await findIncome(jan1OfTheYear);
  
      const totalUsersCount = formatNum(await User.find({}).count());
      const usersOntheMonth = formatNum(await User.find({ updatedAt: { $gte: firstDayOfMonth } }).count());
      // console.log("usersOntheMonth",usersOntheMonth);
  
      const totalSalesCount = formatNum(await countSales());
      // console.log("totalSalesCount",totalSalesCount);
      const salesOnTheYear = formatNum(await countSales(jan1OfTheYear));
      // console.log("salesOnTheYear",salesOnTheYear);
      const salesOnTheMonth = formatNum(await countSales(firstDayOfMonth));
      // console.log("salesOnTheMonth",salesOnTheMonth);
      const salesOnPrevMonth = formatNum( await countSales(firstDayOfPreviousMonth));
      // console.log("salesOnPrevMonth",salesOnPrevMonth);
  
      let salesYear = 2023;
      if (req.query.salesYear) {
        salesYear = parseInt(req.query.salesYear);
      }
  
      if (req.query.year) {
        salesYear = parseInt(req.query.year);
        displayValue = req.query.year;
        xDisplayValue = "Months";
      }
  
      let monthName = "";
      if (req.query.month) {
        salesMonth = "Weeks"; 
        monthName = getMonthName(req.query.month);
        // console.log("monthName",monthName);
        displayValue = `${salesYear} - ${monthName}`;
      }
  
      const totalYears = await orderDb.aggregate([
        {
          $group: {
            _id: {
              createdAt: { $dateToString: { format: "%Y", date: "$createdAt" } },
            },
          },
        },
        { $sort: { "_id:createdAt": -1 } },
      ]);

      const displayYears = [];
  
      totalYears.forEach((year) => {
        displayYears.push(year._id.createdAt);
      });
  
      let orderData;
  
      if (req.query.year && req.query.month) {
        
        orderData = await findSalesDataOfMonth(salesYear, req.query.month);
        // console.log("orderData1",orderData);
      } else if (req.query.year && !req.query.month) {
        orderData = await findSalesDataOfYear(salesYear);
        // console.log("orderData2",orderData);
      } else {
        orderData = await findSalesData();
        // console.log("orderData3",orderData);
      }
  
      let months = [];
      let sales = [];
  
      if (req.query.year && req.query.month) {
        orderData.forEach((year) => {
          months.push(`Week ${year._id.weekNumber}`);
        });
        orderData.forEach((sale) => {
          sales.push(Math.round(sale.sales));
        });
      } else if (req.query.year && !req.query.month) {
        orderData.forEach((month) => {
          months.push(getMonthName(month._id.createdAt));
        });
        orderData.forEach((sale) => {
          sales.push(Math.round(sale.sales));
        });
      } else {
        orderData.forEach((year) => {
          months.push(year._id.createdAt);
        });
        orderData.forEach((sale) => {
          sales.push(Math.round(sale.sales));
        });
      }
  
      let totalSales = sales.reduce((acc, curr) => (acc += curr), 0);
  
      let categories = [];
      let categorySales = [];
  
      const categoryData = await orderDb.aggregate([
        { $match: { "products.orderStatus": "Delivered" } },
        { $unwind: "$products" },
        {
          $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "populatedProduct",
          },
        },
        {
          $unwind: "$populatedProduct",
        },
        {
          $lookup: {
            from: "categories",
            localField: "populatedProduct.category",
            foreignField: "_id",
            as: "populatedCategory",
          },
        },
        {
          $unwind: "$populatedCategory",
        },
        {
          $group: {
            _id: "$populatedCategory.name",
            sales: { $sum: "$totalAmount" },
          },
        },
      ]);
      // console.log("categoryData/////////",categoryData);
      categoryData.forEach((cat) => {
        categories.push(cat._id), categorySales.push(cat.sales);
      });
      // aggregation to take the payment data
      let paymentData = await orderDb.aggregate([
        {
          $unwind: "$products",
        },
        {
          $match: {
            $or: [
              { "products.orderStatus": "Delivered" },
              { paymentStatus: "Complete" },
            ],
            paymentMethod: { $exists: true },
          },
        },
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
          },
        },
      ]);
  
      let paymentMethods = [];
      let paymentCount = [];
  
      paymentData.forEach((data) => {
        paymentMethods.push(data._id);
        paymentCount.push(data.count);
      });
      let orderDataToDownload = await orderDb.find({ "products.orderStatus": "Delivered" }).sort({ createdAt: 1 }).populate("products.productId");
      // console.log("orderDataToDownload",orderDataToDownload );
      if (req.query.fromDate && req.query.toDate) {
        const { fromDate, toDate } = req.query;

        console.log("fromDate",fromDate);
        console.log("toDate",toDate);

        orderDataToDownload = await orderDb.find({"products.orderStatus": "Delivered",createdAt: { $gte: fromDate, $lte: toDate },}).sort({ createdAt: 1 });
              console.log("orderDataToDownload",orderDataToDownload );
      }
  
      res.render("home", {
        totalUsersCount,
        usersOntheMonth,
        totalSalesCount,
        salesOnTheYear,
        totalIncome,
        thisMonthIncome,
        thisYearIncome,
        salesOnTheMonth,
        salesOnPrevMonth,
        salesYear,
        displayYears,
        totalSales,
        months,
        sales,
        categories,
        categorySales,
        paymentMethods,
        paymentCount,
        orderDataToDownload,
      });
    } catch (error) {
      console.log(error);
      res.render("500");
    }
  };

  function getMonthName(monthNumber) {
    if (typeof monthNumber === "string") {
      monthNumber = parseInt(monthNumber);
    }
  
    if (monthNumber < 1 || monthNumber > 12) {
      return "Invalid month number";
    }
  
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[monthNumber - 1];
  }

  // New function to load the sales report
const loadSalesReport = async (req, res) => {
  try {
      let orderDataToDownload;

      if (req.query.fromDate && req.query.toDate) {
          const { fromDate, toDate } = req.query;
          orderDataToDownload = await orderDb.find({
              "products.orderStatus": "Delivered",
              createdAt: { $gte: fromDate, $lte: toDate }
          }).sort({ createdAt: 1 }).populate("products.productId");
      } else {
          orderDataToDownload = await orderDb.find({ "products.orderStatus": "Delivered" })
              .sort({ createdAt: 1 })
              .populate("products.productId");
      }

      res.render("sales-report", {
          orderDataToDownload,
      });
  } catch (error) {
      console.error("Error loading sales report:", error);
      res.status(500).render("500");
  }
};

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





//logout in admin home 

const logout = async (req, res) => {

    try {

        req.session.destroy();
        res.redirect('/admin');

    } catch (error) {
        console.log(error.message);
    }
}


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
                // console.log("productData",productData)
                const userDetails = await User.findOne({ firstName: order.userName });
        
                if (productData && productValue.orderStatus !== 'Failed') {
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
            paymentStatus = 'Complete';
        }else if(productDetails.orderStatus === 'Returned'){
          paymentStatus = "Refund"
        }
        else{
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
      // console.log("orderId",orderId);
      // console.log("status",status);

      
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


const top_sellers = async (req, res) => {
  try {
      const products = await getTopSellingProducts();
      const categories = await getTopSellingCategories();
      const brands = await getTopSellingBrands();

      res.render('top-sellers', { 
          message: 'Top Sellers', 
          products, 
          categories,
          brands
      });
  } catch (error) {
      res.status(500).send('Failed to load top sellers');
  }
};




module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    loadSalesReport,
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
    changeOrderStatus,
    top_sellers
}