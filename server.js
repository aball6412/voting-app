var express = require("express");
var app = express();
var passport = require("passport");
var Strategy = require("passport-twitter").Strategy;
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId;
var poll_collection;



//Get the port and database URLs for production and development
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


passport.use(new Strategy(
    {
        consumerKey: process.env.CONSUMER_KEY,
        consumerSecret: process.env.CONSUMER_SECRET,
        callbackURL: "http://localhost:3000/login/twitter/return"
    },
    function(token, tokenSecret, profile, cb) {
        
        console.log("made it to login");
        console.log(profile);
        return cb(null, profile);
    }
));




passport.serializeUser(function(user, cb) {
    
    cb(null, user.id);
});

passport.deserializeUser(function(obj, cb) {
    
    cb(null, obj);
});

app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());



//Serve up static files
app.use("/", express.static(__dirname + "/public"));



app.set("view engine", "ejs");






app.get("/", function(request, response) {
    
    console.log(request.user);
    if (request.user) {
        console.log(request.user.displayName);
    }
    
    
    var all_polls = [];

    //Get all of the polls in the database
    var polls = poll_collection.find().toArray(function(err, documents) {
        
        if (err) throw err;
        
        //Get the title and id of each of those polls and put them into all_polls list
        for (var i in documents) {  
            
            var title = documents[i].title;
            var id = documents[i]._id;
            all_polls.push([title, id]); 
        };
        
        //Put title and id into data object and send it to client
        var data = 
        {
            auth: "no",
            all_polls: all_polls,
        };
    
        response.render("index", data);
        
        
    }); //End of poll db query


    
}); 







app.get("/poll/:id", function(request, response) {

    console.log(request.user);
    if(request.user) {
        console.log(request.user.name);
    }
    
    var id = request.params.id;


    poll_collection.find( {_id: new ObjectId(id) } ).toArray(function(err, documents) {
        
        var title = documents[0].title;
        var options = documents[0].options;

        var data = 
        {
            auth: "no",
            voted: "no",
            poll_id: id,
            poll_name: title,
            poll_results: options
        }
        
        response.render("poll", data);
        
        
    }); //End database query
    
    
   
  
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
    
    //If adding a new poll then insert variable will say "yes"
    var insert = request.query.insert;
    //If adding a vote then my_vote variable will say yes
    var my_vote = request.query.my_vote;
    
    
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

            response.send("Success");
        
    } //end if insert
    
    else if (my_vote === "yes") {
        
        //Get variables we need to query the database
        var id = request.query.poll_id;
        var vote = request.query.vote;
        
        //Find out if option exits already or not
        //If it does not exist then add the new option with votes of 1
        //If it does exist then just add one vote to it
        poll_collection.find(
            { _id: new ObjectId(id), "options.option": vote },
            
            { _id: 0, title: 0 }
        ).toArray(function(err, documents) {
            
            if(documents.length === 0) {
                
                var obj = 
                    {
                        option: vote,
                        votes: 1
                    }
                
                poll_collection.update(
                    { _id: new ObjectId(id) },
                    
                    { $push: { options: obj } }
                );
                
                response.send("Success");
                
            }//End if
            
            else {
                
                //If option already exists then add one vote to it
                poll_collection.update(
                    { _id: new ObjectId(id), "options.option": vote },
            
                    { $inc: { "options.$.votes": 1 } }
                );
                
                response.send("Success");
                
            }//End else
            
        }); // End poll query
  
    } //End else if my_vote
    

    
}); //End update poll



app.get("/login/twitter", passport.authenticate("twitter"), function(request, response) {
    
    console.log("login request received");
});

app.get("/login/twitter/return", passport.authenticate("twitter", { failureRedirect: "/" }), function(request, response) {
    
    response.redirect("/");
    
});



app.listen(port);









