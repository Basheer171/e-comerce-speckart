const Offer = require('../models/offerModel');


//------------------------------------------- Load View Offer Page ------------------------------------------//
const loadViewOffer = async (req, res) => {
    try {
        
        const offerData = await Offer.find().sort({ date: -1 });

        res.render('view-offers', {
            title: 'View Offers',
            offerData: offerData,
            now: new Date() 
        });

        return;
    } catch (error) {
        console.error(error);
        res.status(500).render('500');
    }
};



// --------------------------------------- Load Add Offer Page ---------------------------------------------//
const loadAddOffer = async(req, res)=>{
    try {

        res.render('add-offer',{title:'Add Offer'});
        
    } catch (error) {
        console.log(error);
        res.status(500).render('500');
    }
};

//-------------------------------------- Add Offers -----------------------------------------------------//
const addOffer = async(req, res)=>{
    try {
       
        const { startingDate, expiryDate, percentage }=req.body;
        const offerName = req.body.offerName.toUpperCase();

        const existOffer = await Offer.findOne({offerName:offerName});
        if(existOffer){
            res.render('add-offer',{
                message:'Offer already existing',
                title:'add-offer'
            });

        }else{

            const offers = new Offer({
                offerName:offerName,
                startingDate:startingDate,
                expiryDate:expiryDate,
                percentage:percentage
            });

            await offers.save();

            res.redirect('/admin/view-offers');

        }
        
        
    } catch (error) {
        console.log(error);
        res.status(500).render('500');
    }
};


// ------------------------------------------- Load Edti Offer Page ------------------------------------------//
const loadEditOffer = async(req, res)=>{
    try {

        const offerId = req.query.offerId;

        const offerData = await Offer.findById({_id:offerId})
        if(offerData){
            res.render('edit-offer',{
                title:'Edit Offer',
                offerData:offerData
            })
        }
        
        
    } catch (error) {
        console.log();
        res.status(500).render('500');
    }
};

// ---------------------------------- Update Offer ---------------------------------------------//
const editOffer = async(req, res)=>{
    try {

        const id = req.body.id;
        // console.log("id",id);
        
        const updatedOffer = await Offer.updateOne({_id:id},
            {$set:{
                offerName:req.body.offerName.toUpperCase(),
                startingDate:req.body.startingDate,
                expiryDate:req.body.expiryDate,
                percentage:req.body.percentage

            }});

            if(updatedOffer){

                res.redirect('/admin/view-offers')
            }
        
    } catch (error) {
        console.log(error);
        res.status(500).render('500');
    }
};

//------------------------------------------ Cancel Offer ---------------------------------------------//
const cancelOffer = async (req, res) => {
    try {
        const offerId = req.body.offerId;
        console.log("offerId", offerId);

        const cancelled = await Offer.updateOne({ _id: offerId }, { $set: { status: false } });
        console.log("cancelled", cancelled);

        if (cancelled.modifiedCount > 0) {
            res.json({ status: true });
        } else {
            res.json({ status: false });
        }
    } catch (error) {
        console.error("Error cancelling offer:", error);
        res.status(500).json({ status: false, error: "Internal Server Error" });
    }
};
    

module.exports={
    loadViewOffer,
    loadAddOffer,
    addOffer,
    loadEditOffer,
    editOffer,
    cancelOffer
}