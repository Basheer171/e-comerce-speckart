const mongoose = require("mongoose");

//model to connect to the database

const userSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: true
    },
    secondName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: true
    },
    is_admin: {
        type: Number,
        required: false
    },
    is_verified: {
        type: Number,
        default: 0
    },
    token: {
        type: String,
        default: ''
    },
    is_block: {
        type: Boolean,
        default: false
    }
}, { timestamp: true });


module.exports = mongoose.model('user', userSchema);