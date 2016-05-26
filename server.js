var express = require("express");
var app = express();
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;

var port = process.env.PORT || 3000;


var dburl = process.env.MONGOLAB_URI || "mongodb://localhost:27017/voting_app";


MongoClient.connect(dburl, function(err, db) {
    
    if (err) {
        console.log("Could not connect to " + dburl);
    }
    else {
        console.log("Successful connection to " + dburl);
    }
    //set db.collection variables for the various database collections
    
});


//Serve up static files
app.use("/", express.static(__dirname + "/public"));


app.set("view engine", "ejs");






app.get("/", function(request, response) {
    
    // Variables needed, auth, user {name: }, polls []
    //Do work
    
    var data = 
        {
            auth: "no",
            user: { name: "Aaron" },
            all_polls: ["test1", "test2", "test3", "test4", "test5"]
        };
    

    response.render("index", data);
    
});


app.get("/poll", function(request, response) {
    
    //Do work
    
    var data = 
        {
            auth: "no",
            voted: "no",
            poll_name: "Poll Name",
            poll_results: [["Elon Musk", "10"], ["Steve Jobs", "7"], ["Jeff Bezos", "3"]]
        }
   
    
    
    
    response.render("poll", data);
    
});


app.get("/user", function(request, response) {
    
   //Do work
    
     var data = 
        {
            auth: "no",
            mypolls: ["mypoll1", "mypoll2", "mypoll3", "mypoll4", "mypoll5", "mypoll6"]
        };
     
    response.render("user", data);
    
});


app.get("/newpoll", function(request, response) {
    
    //Maybe build this in on top of other pages. Ex: a popup window where you can build the poll
    
    var data = 
        {
            auth: "no",
        };
    
    response.render("newpoll", data);
    
});


app.get("/updatepoll", function(request, response) {
    
    
    console.log(request.query.title);
    console.log(request.query.options);
    console.log("poll has been updated");
    
    
   //response.redirect("/");
    response.send("Your poll has been created");
    
});



app.listen(port);









