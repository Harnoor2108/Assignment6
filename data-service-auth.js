var mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    "userName" : String ,
    "password" : String , 
    "email"    : String , 
    "loginHistory" : {
        "dateTime" : Date,
        "userAgent" : String
    }


});

let User;

module.exports.initialize = function() {

    return new Promise((resolve, reject) => {

        User= mongoose.createConnection("mongodb+srv://Harnoor:ABCD1234@senecaweb.5b7lhgu.mongodb.net/?retryWrites=true&w=majority",{ useNewUrlParser: true, useUnifiedTopology: true }, (error) => {
            if(error)
            {
                console.log(error);
                reject();
            }
            else {
                console.log("connection successful");
                User = User.model("users", userSchema); 
                resolve();           
                }
            });

    });


}


module.exports.registerUser = function(userData) {

return new Promise((resolve, reject) => {

    if(userData.password === "" || userData.password == " " || userData.password2 === "" || userData.password2 == " ")
    {
        reject("Error: user name cannot be empty or only white spaces! ");

    }

    else if(userData.password!=userData.password2)
    {
        reject("Error: Passwords do not match");

    }
    else{
        bcrypt.genSalt(10, function(err, salt) { // Generate a "salt" using 10 rounds
            bcrypt.hash(userData.password, salt, function(err, hashValue) { // encrypt the password: "myPassword123"
               if(err){
                reject("There was an error encrypting the password");   
               }else{
                userData.password = hashValue;
               }})
               
        let newUser = new User(userData); 
        newUser.save().then(() => {

            resolve();

        }).catch((err) => {
            if(err && err.code == 11000)
            {
                reject("User Name already taken");
            }
            if(err && err.code != 11000)
            {

                reject("There was an error creating the user: " + err);
            }
        });
               
     } )
    }
});


}




module.exports.checkUser = ((userData) => {

return new Promise((reject, resolve) => {

User.findOne({userName : userData.userName})
.exec()
.then((data) => {
    if(!data)
    {
        reject("Unable to find user: " + userData.userName);
    }
    else
    {
        if(data.password != userData.password)
        {
            reject( "Incorrect Password for user: " +userData.userName );
        }
        else
        {
            data.loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
            User.updateOne(
                { userName: data.userName},
                { $set: { loginHistory:  data.loginHistory} }
              ).exec()
              .then((userData) => {
                console.log("Success");
                resolve(data);
              })
              .catch((err) => {
                console.log(err);
                reject("Unable to find user: "+userData.user);
              });
        }
    }
})
.catch((err) =>
{
    reject("There was an error verifying the user: " +err);
});
});

});