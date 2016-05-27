var express = require("express");
var app = express();
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var poll_collection;


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
    poll_collection = db.collection("polls");
    
});


//Serve up static files
app.use("/", express.static(__dirname + "/public"));


app.set("view engine", "ejs");






app.get("/", function(request, response) {
    
    var all_polls = [];

    //Get all of the polls in the database
    var polls = poll_collection.find().toArray(function(err, documents) {
        
        if (err) throw err;
        
        //Get the title of each of those polls
        for (var i in documents) {  
            
            var title = documents[i].title;
            var id = documents[i]._id;
            all_polls.push([title, id]); 
        };
        
        console.log(all_polls);
        
        
        
        var data = 
        {
            auth: "yes",
            all_polls: all_polls,
        };
    
        response.render("index", data);
        
        
    }); //End of poll db query


    
});


app.get("/poll/:id", function(request, response) {
    
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
            auth: "yes",
        };
    
    response.render("newpoll", data);
    
});






app.get("/updatepoll", function(request, response) {
    
    var insert = request.query.insert;
    
    //If we are creating a new poll then do this...
    if (insert === "yes") {
        
        var title = request.query.title;


        //Get each option, put it in an object along with 0 votes ( since it's a newly created poll)
        //Push that new object into options_and_votes list
        var options = request.query.options;
        var options_and_votes = [];

        for (var i in options) {

            var obj = {
                option: options[i],
                votes: 0
            };

            options_and_votes.push(obj);
        } //End for


            poll_collection.insert({
                title: title,
                options: options_and_votes
            }); 

            response.send("Your poll has been created");
        
    } //end if insert
    
    

    
});



app.listen(port);









