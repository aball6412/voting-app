var express = require("express");
var app = express();
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;

var port = process.env.PORT || 3000;

//BE SURE TO MAKE DATABASE NAME VOTING_APP
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
//app.use("/", express.static(__dirname + "/public"));


app.set("view engine", "ejs");






app.get("/", function(request, response) {
    
    //Do work
    
    response.render("index");
    
});


app.get("/poll", function(request, response) {
    
    //Do work
    
    response.render("poll");
    
});


app.get("/user", function(request, response) {
    
   //Do work
    
    response.render("user");
    
});


app.get("/newpoll", function(request, response) {
    
    //Maybe build this in on top of other pages. Ex: a popup window where you can build the poll
    
    response.render("newpoll");
    
});



app.listen(port);









