const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://mubasheertcs:basheer123@cluster0.phybh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/SPECKART");

const path = require("path");
const nocache = require("nocache");
const express = require("express");
require('dotenv').config();
const session = require("express-session");
const config = require("./config/config");
const app = express();


app.use(session({secret:config.sessionSecret,resave: false,saveUninitialized: true,}));

const userRoute = require('./routes/userRoute');

const adminRoute = require('./routes/adminRoute');

app.use("/public",express.static(path.join(__dirname, "public")))

// app.use(nocache());

const disableBackButton = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store,must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '1');
    next();
  };

  

  app.use('/admin',disableBackButton, nocache(), adminRoute);  
//for user routes 
app.use('/',disableBackButton,userRoute);

//for admin routes




const port=3000

app.listen(port, function () {
    console.log(`Server is running at http://localhost:${port}`);
    console.log(`Server is running at http://localhost:${port}/register`);
});