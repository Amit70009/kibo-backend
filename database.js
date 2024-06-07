var Constant = require("./commonfunction");
var mongoose = require("mongoose");

function databaseConn(){
    mongoose.connect(Constant.mongoUrl, {serverSelectionTimeoutMS: 30000 })
.then(console.log("Database connected Successfully"))
.catch((err) => {
    console.log("Error", err);
    throw err
})}

//         if(err){
//             console.log("errror", err);
//             throw err
//         }
//         console.log("DB connected Successfully");
//     })
// }

module.exports = {
    databaseConn
};