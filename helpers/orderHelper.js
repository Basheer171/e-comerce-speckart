const Orders = require('../models/orderModels')


const findIncome = async (startDate = new Date('1990-01-01'), endDate = new Date()) => {
    try {
        const ordersData = await Orders.find({
            $or: [
                { "products.orderStatus": "Delivered" },
                { "createdAt": { $gte: startDate, $lt: endDate } },
            ]
        });

        let totalIncome = 0;

        for (const order of ordersData) {
            if (order.discount && order.discount > 0) {
                // If a coupon was applied, calculate income using totalAmount after discount
                for (const pdt of order.products) {
                    if (pdt.orderStatus === 'Delivered') {
                        totalIncome += parseInt(order.totalAmount);
                    }
                }  } else {
                // If no coupon, sum the total prices of delivered products
                for (const pdt of order.products) {
                    if (pdt.orderStatus === 'Delivered' ) {
                        totalIncome += parseInt(pdt.totalPrice);
                    }
                }
            }
        }

        return formatNum(totalIncome);

    } catch (error) {
        throw error;
    }
};




const countSales = async(startDate = new Date('1990-01-01'), endDate = new Date()) => {
    try {
        const ordersData = await Orders.find(
            {
                "products.orderStatus": "Delivered",
                createdAt: {
                    $gte: startDate,
                    $lt: endDate 
                }
            }
        );
        // console.log("ordersData", ordersData);

        
        let salesCount = 0;
        for( const order of ordersData){
            for(const pdt of order.products){
                if(pdt.orderStatus=== 'Delivered'){
                    salesCount += pdt.quantity;
                }
            }
        }

        // console.log("salesCount",salesCount);
        return salesCount;

    } catch (error) {
        throw error
    }
}

const findSalesData = async(startDate = new Date('1990-01-01'), endDate = new Date()) => {
    try {
        const pipeline = [
            {
                $match: {
                    "producuts.orderStatus": 'Delivered',
                    date: {
                        $gte: startDate,
                        $lt: endDate
                    }
                }
            },
            {
                $group:{
                    _id: { createdAt: { $dateToString: { format: '%Y', date: '$createdAt'}}},
                    sales: { $sum: '$totalAmount' }
                }
            },
            {
                $sort: { '_id. createdAt' : 1 }
            }
        ]

        const orderData = await Orders.aggregate(pipeline)

        // console.log("orderData",orderData);

        return orderData

    } catch (error) {
        throw error
    }
}

const findSalesDataOfDay = async (startDate = new Date('1990-01-01'), endDate = new Date()) => {
    try {
        const pipeline = [
            {
                $match: {
                    "products.orderStatus": 'Delivered',  // Filter for delivered products
                    createdAt: {                          // Filter orders by date range
                        $gte: startDate,
                        $lt: endDate
                    }
                }
            },
            {
                $unwind: "$products"  // Unwind the products array to process individual products
            },
            {
                $match: {
                    "products.orderStatus": 'Delivered'  // Ensure that only delivered products are considered
                }
            },
            {
                $group: {
                    _id: { createdAt: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }}},  // Group by day
                    totalSales: { $sum: '$products.totalPrice' },  // Sum up the total sales for each day
                    salesCount: { $sum: '$products.quantity' } // Count the number of products sold
                }
            },
            { $sort: { '_id.createdAt': 1 } }  // Sort by date in ascending order
        ];

        const orderData = await Orders.aggregate(pipeline);
        return orderData;

    } catch (error) {
        throw error;
    }
};





const findSalesDataOfMonth = async (year, month) => {
    try {
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const lastDayOfMonth = new Date(year, month, 0);

        const pipeline = [
            {
                $match: {
                    "products.orderStatus": 'Delivered',
                    date: {
                        $gte: firstDayOfMonth,
                        $lt: lastDayOfMonth,
                    },
                },
            },
            {
                $addFields: {
                    weekNumber: {
                        $ceil: {
                            $divide: [
                                { $subtract: ["$date", firstDayOfMonth] },
                                604800000, // milliseconds in a week (7 days)
                            ],
                        },
                    },
                },
            },
            {
                $group: {
                    _id: { weekNumber: "$weekNumber" }, // Group by week number
                    sales: { $sum: '$totalAmount' }, // Corrected to 'totalAmount'
                },
            },
            { $sort: { '_id.weekNumber': 1 } },
        ];

        const orderData = await Orders.aggregate(pipeline);
        // console.log("pipeline is:", orderData);
        return orderData;
    } catch (error) {
        throw error;
    }
};
const findSalesDataOfYear = async(year) => {
    try {
        
        const pipeline = [
            {
                $match: {
                    "producuts.orderStatus": 'Delivered',
                    date: {
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${year + 1}-01-01`)
                    }
                }
            },
            {
                $group:{
                    _id: {  createdAt: { $dateToString: { format: '%m', date: '$createdAt'}}},
                    sales: { $sum: '$totalAmount' }
                }
            },
            {
                $sort: { '_id. createdAt' : 1 }
            }
        ]

        const orderData = await Orders.aggregate(pipeline)

        // console.log("findSalesDataOfYear : ",orderData);
        return orderData

    } catch (error) {
        throw error
    }
}

const getTopSellingProducts = async () => {
    try {
        const topProductsPipeline = [
            { $unwind: "$products" },
            { $match: { "products.orderStatus": "Delivered" } },
            {
                $group: {
                    _id: "$products.productId",
                    totalQuantity: { $sum: "$products.quantity" },
                    totalSales: { $sum: "$products.totalPrice" }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $project: {
                    productName: "$productDetails.name",
                    productImage: "$productDetails.image",
                    totalQuantity: 1,
                    totalSales: 1
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ];

        const topProducts = await Orders.aggregate(topProductsPipeline);
        return topProducts;
    } catch (error) {
        throw error;
    }
};




const getTopSellingCategories = async () => {
    try {
        const topCategoriesPipeline = [
            { $unwind: "$products" },  // Unwind the products array
            { $match: { "products.orderStatus": "Delivered" } },  // Filter by delivered products
            { 
                $lookup: {
                    from: "products",  // Lookup the 'products' collection
                    localField: "products.productId",  // Match the productId in Orders
                    foreignField: "_id",  // Match it with the _id in the Product collection
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },  // Unwind the fetched product details
            { 
                $group: {
                    _id: "$productDetails.category",  // Group by the product's categoryId
                    totalQuantity: { $sum: "$products.quantity" },
                    totalSales: { $sum: "$products.totalPrice" }
                }
            },
            {
                $lookup: {
                    from: "categories",  // Lookup the category collection
                    localField: "_id",  // Match the category _id
                    foreignField: "_id",  // Lookup in the categories collection
                    as: "categoryDetails"
                }
            },
            { $unwind: "$categoryDetails" },  // Unwind category details
            { 
                $project: {
                    categoryName: "$categoryDetails.categoryName",
                    categoryImage:"$categoryDetails.image",
                    totalQuantity: 1,
                    totalSales: 1
                }
            },
            { $sort: { totalQuantity: -1 } },  // Sort by total quantity sold
            { $limit: 10 }  // Limit to the top 10
        ];

        const topCategories = await Orders.aggregate(topCategoriesPipeline);
        // console.log("topCategories", topCategories);
        
        return topCategories;
    } catch (error) {
        throw error;
    }
};



const getTopSellingBrands = async () => {
    try {
        const topBrandsPipeline = [
            { $unwind: "$products" },  // Unwind the products array
            { $match: { "products.orderStatus": "Delivered" } },  // Filter by delivered products
            { 
                $lookup: {
                    from: "products",  // Lookup the 'products' collection
                    localField: "products.productId",  // Match the productId in Orders
                    foreignField: "_id",  // Match it with the _id in the Product collection
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },  // Unwind the fetched product details
            { 
                $group: {
                    _id: "$productDetails.brandName",  // Group by the product's brandId
                    totalQuantity: { $sum: "$products.quantity" },
                    totalSales: { $sum: "$products.totalPrice" }
                }
            },
            {
                $lookup: {
                    from: "brands",  // Lookup the brands collection
                    localField: "_id",  // Match the brand _id
                    foreignField: "_id",  // Lookup in the brands collection
                    as: "brandDetails"
                }
            },
            { $unwind: "$brandDetails" },  // Unwind brand details
            { 
                $project: {
                    brandName: "$brandDetails.brandName",
                    brandImage:"$brandDetails.image",
                    totalQuantity: 1,
                    totalSales: 1
                }
            },
            { $sort: { totalQuantity: -1 } },  // Sort by total quantity sold
            { $limit: 10 }  // Limit to the top 10
        ];

        const topBrands = await Orders.aggregate(topBrandsPipeline);
        // console.log("topBrands", topBrands);
        
        return topBrands;
    } catch (error) {
        throw error;
    }
};


const  formatNum = (num) => {
    if (num >= 10000000) {
        return (num / 10000000).toFixed(2) + ' Cr';
    } else if (num >= 100000) {
        return (num / 100000).toFixed(2) + ' L';    
    } else if(num >= 1000){
        return (num / 1000).toFixed(2) + ' K '
    } else {
        return num.toString();
    }
}


module.exports = {
    formatNum,
    findIncome,
    countSales,
    findSalesData,  
    findSalesDataOfYear,
    findSalesDataOfDay,
    findSalesDataOfMonth,
    getTopSellingProducts,
    getTopSellingCategories,
    getTopSellingBrands
}