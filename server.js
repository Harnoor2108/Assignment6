
/*************************************************************************
* BTI325– Assignment 4 
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. 
No part of this assignment has been copied manually or electronically from any other source.
* (including 3rd party web sites) or distributed to other students.
* 
* Name: Harnoor Kaur Student ID: 156624215 Date: 12-11-2022
* 
* Your app’s URL (from Cyclic Heroku) that I can click to see your application: 
* https://odd-tan-hedgehog-shoe.cyclic.app
* 
*************************************************************************/
//For assignment 3 heroku link
//  https://odd-tan-hedgehog-shoe.cyclic.app


const express = require("express");
let dataServiceAuth = require("./data-service-auth.js");
let dataService = require('./data-service.js');
let clientSessions = require("client-sessions");
const path = require("path");
const app = express();
const multer = require("multer");
const PORT = process.env.PORT || 8080;
const fs = require("fs");
const exphbs = require("express-handlebars");
const { homedir } = require("os");



    function onHTTPStart() {

      console.log(`Express http server listening on ${PORT}`);
  }

  app.use(clientSessions({

    cookieName : "session",
    secret : "assignment-6" ,
    duration : 2 * 60 * 1000,
    activeDuration : 1000 * 60 

  }));

  app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
   });


   function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect("/login");
    } else {
      next();
    }
  }
   
   //CUSTOM HELPERS
   //---------------------------------------------------------------------------------
   

   //----------------------------------------------------------------------------------
  //ASSIGNMENT 4
  app.engine('.hbs', exphbs.engine({ extname: '.hbs' , defaultLayout: "main",
  helpers: {navLink:function(url, options){
    return '<li' + 
    ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
   
    '><a href=" ' + url + ' ">' + options.fn(this) + '</a></li>';
   }
,
   equal : function (lvalue, rvalue, options) {
    if (arguments.length < 3)
    throw new Error("Handlebars Helper equal needs 2 parameters");
    if (lvalue != rvalue) {
    return options.inverse(this);
    } else {
    return options.fn(this);
    } 
   }}
}));
app.set('view engine', '.hbs');

app.use(function(req,res,next){
  let route = req.baseUrl + req.path;
  app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
  next();
 });
//Two more functions 

  app.use(express.json()); 
app.use(express.urlencoded({extended: true}));

// Using the multer functions  a3
  const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function(req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
     }
  });

  const upload = multer({ storage: storage });
  //Using POST 

  app.post("/images/add",ensureLogin , upload.single("imageFile"), (req, res) => {

    
    res.redirect('/images');
  })

  //----------------------------------------------------------------------

  app.get("/login", (req,res) => {


res.render("login");

  });

app.get("/register" , (req,res) => {

  res.render("register");
});


app.post("/register" , (req, res) => {

  dataServiceAuth.registerUser(req.body).then((data) => {
res.render("register", {successMessage:"User created"});
  }).catch((err) => {

    res.render("register",{errorMessage: err, userName: req.body.userName});
  })

});


app.post("/login" , (req,res) => {
  req.body.userAgent = req.get('User-Agent');
  dataServiceAuth.checkUser(req.body).then((data) => {
    req.session.user = {
      userName: data.userName,// complete it with authenticated user's userName
      email: data.email,// complete it with authenticated user's email
      loginHistory:data.loginHistory // complete it with authenticated user's loginHistory
      }
      res.redirect('/employees');
     

  }).catch((err) => {
    res.render("login",{errorMessage: err, userName: data.userName});

  })

});

app.get('/logout', function(req, res) {
  req.session.reset();
  res.redirect("/");
});

app.get('/userHistory',ensureLogin, function(req, res) {
  res.render('userHistory');
});
  //----------------------------------------------------------------------

  app.post("/employees/add" ,ensureLogin , (req,res) => {

dataService.addEmployee(req.body).then((data) =>{

  dataService.addDepartment().then(() => {
    res.render("addEmployee", {departments: data});
  }).catch((err) => {

    res.render("addEmployee", {departments: []});

  })
 
}) .catch((err) => {

  res.send(err);
})

  })

  app.post("/employee/update",ensureLogin , (req, res) => {
   dataService.updateEmployee(req.body).then(()=> {

    res.redirect("/employees");
   })
   
   });
  //GET

  app.get("/images", ensureLogin ,function(req, res){
   // res.render("images");
   fs.readdir("./public/images/uploaded", function(err, items)
   {
    if(err)
    {
      console.log(err);
    }else{

      res.render("images",{imgdata:items});
    }


   });
   /* fs.readdir("./public/images/uploaded", function(err, items){

      
      res.json("images :" + items);
    })*/

  });

app.use(express.static('public'));

app.get("/", function(req, res) {

  res.render("home");
});

app.get("/about", function(req, res) {

    res.render("about");
    
    });


    //Assignment 3 changes

    app.get("/employees", ensureLogin ,(req, res) => {
   
      if(req.query.status){
        dataService.getEmployeesByStatus(req.query.status).then((data) =>{
          if(data.length > 0)
          {
          res.render("employees", 
          {employees: data})
          } 
        else{
         res.render("employees",{ message: "no results" });
        }}).catch((err) => {
          res.send(err);
        })
      }
      else if(req.query.department) {
        dataService.getEmployeesByDepartment(req.query.department).then((data) =>{
          if(data.length > 0)
          {
          res.render("employees", 
          {employees: data})
          } 
        else{
         res.render("employees",{ message: "no results" });
        } }).catch((err) => {
            res.send(err);
          })

      }
      else if(req.query.manager)
      {

        dataService.getEmployeesByManager(req.query.manager).then((data) =>{
          if(data.length > 0)
          {
          res.render("employees", 
          {employees: data})
          } 
        else{
         res.render("employees",{ message: "no results" });
        }}).catch((err) => {
            res.send(err);
          })
      }
      else{
      dataService.getAllEmployees().then((data) => {
        if(data.length > 0)
        {
        res.render("employees", 
        {employees: data})
        } 
      else{
       res.render("employees",{ message: "no results" });
      }}).catch((err) => {
      res.render({message: "no results"});
      })
    }
    })

    app.get("/employee/:empNum",ensureLogin , (req, res) => {
      // initialize an empty object to store the values
      let viewData = {};
      dataService.getEmployeeByNum(req.params.empNum).then((data) => {
      if (data) {
      viewData.employee = data; //store employee data in the "viewData" object as "employee"
      } else {
      viewData.employee = null; // set employee to null if none were returned
      }
      }).catch(() => {
      viewData.employee = null; // set employee to null if there was an error 
      }).then(dataService.getDepartments)
      .then((data) => {
      viewData.departments = data; // store department data in the "viewData" object as 
     "departments"
      // loop through viewData.departments and once we have found the departmentId that matches
      // the employee's "department" value, add a "selected" property to the matching 
      // viewData.departments object
      for (let i = 0; i < viewData.departments.length; i++) {
        if (viewData.departments[i].departmentId == viewData.employee.department) {
        viewData.departments[i].selected = true;
        }
        }
        }).catch(() => {
        viewData.departments = []; // set departments to empty if there was an error
        }).then(() => {
        if (viewData.employee == null) { // if no employee - return an error
        res.status(404).send("Employee Not Found");
        } else {
        res.render("employee", { viewData: viewData }); // render the "employee" view
        }
        });
       });
       
       
    app.get("/employees/add",ensureLogin , (req, res) => {

      res.render("addEmployee");

    })

    app.get("/images/add", ensureLogin ,(req, res) => {

     res.render("addImage");
      
          })


          app.get("/employees/delete/:empNum", (req,res) => {

            dataService.deleteEmployeeByNum(empNum).then(() => {

              res.redirect("/employees");
            }).catch((err) => {
              res.status(500).send('Unable to Remove Employee / Employee not found)');
            })

          })

//Queries



      app.get('/managers', function (req, res) {
      dataService.getManagers().then((data) => {
        res.json(data);
      });
    });

    app.get('/departments', ensureLogin ,function (req, res) {
      dataService.getDepartments().then((data) => {
        if(data.length > 0)
        {
        res.render("departments", 
        {departments: data})
        } 
      else{
       res.render("departments",{ message: "no results" });
      }
      });
    });


    app.get('/departments/add',ensureLogin , (req, res) => {

      res.render("addDepartment");

    })


    app.post('/departments/add',ensureLogin , (req,res) => {

      dataService.addDepartment(req.body).then((data) =>{

        res.redirect("/departments");
      }) .catch((err) => {
      
        res.send(err);
      })

    })


    app.post('/department/update' ,ensureLogin , (req,res) => {

      dataService.updateDepartment(req.body).then(()=> {

        res.redirect("/departments");
       })
             

    })


    app.get('/department/:departmentId' , ensureLogin ,(req, res) => {
      dataService.getDepartmentById(req.params.departmentId).then((data)=> {
        if(data.departmentId == 0)
        {
         // res.status(404).send("Department not found");
        }
        else
        res.render("department", { department: data });
      })
      .catch((err) => {
       // res.status(404).send("Department not found");
      //  res.render("department",{message:"no results"});
      })
      
     } )



 app.use(function (req, res) {
      res.status(404).send('Page Not Found');
    });


    dataService.initialize()
    .then(dataServiceAuth.initialize)
    .then(function(){
     app.listen(PORT, function(){
     console.log("app listening on: " + PORT)
     });
    }).catch(function(err){
     console.log("unable to start server: " + err);
    });
