const multer = require("multer");



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

module.exports = {
    upload,
}