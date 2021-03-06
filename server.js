var express = require("express");
var app = express();
var passport = require("passport");
var Strategy = require("passport-twitter").Strategy;
var bodyparser = require("body-parser");
var cookieparser = require("cookie-parser");
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId;
var poll_collection;
var auth;
var username;


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




//Set up passport Twitter Strategy
passport.use(new Strategy(
    {
        consumerKey: process.env.CONSUMER_KEY,
        consumerSecret: process.env.CONSUMER_SECRET,
        //callbackURL: "http://localhost:3000/login/twitter/return" //<-----DEVELOPMENT LOCAL URL
        callbackURL: "https://vote-app.herokuapp.com/login/twitter/return"
    },
    function(token, tokenSecret, profile, cb) {
        
        return cb(null, profile);
        //Get user_id and username and save both to db if I want to use username later.
    }
));



//Serialize and deserialize user information
passport.serializeUser(function(user, cb) {
    cb(null, user.id);

});

passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
    //To add username I'd get obj back with the user_id and then query database where I'd have username saved.

});

//Add all of the middlewares needed for passport to work correctly
app.use(bodyparser.urlencoded({extended: false}));
app.use(cookieparser());
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());



//Serve up static files
app.use("/", express.static(__dirname + "/public"));



app.set("view engine", "ejs");






app.get("/", function(request, response) {
    
 
    //Check to see if user is signed in or not
    if (request.user) {
        auth = "yes";
        var user_id = request.user;
    }
    else {
        auth = "no";
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
            auth: auth,
            all_polls: all_polls,
            user_id: user_id
        };
    
        response.render("index", data);
        
        
    }); //End of poll db query


    
}); 







app.get("/poll/:id", function(request, response) {

    //Check to see if user is signed in or not. If yes then add user_id variable
    if (request.user) {
        auth = "yes";
        var user_id = request.user;
    }
    else {
        auth = "no";
        var user_id = "no user_id";
    }
    
    
    
    var id = request.params.id;


    poll_collection.find( {_id: new ObjectId(id) } ).toArray(function(err, documents) {
        
        var title = documents[0].title;
        var options = documents[0].options;
        //If it's user's poll then set isMyPoll to yes. Otherwise, set to no
        if (user_id === documents[0].user_id) {
            var isMyPoll = "yes";   
        }
        else {
            var isMyPoll = "no";
        }
        

        var data = 
        {
            auth: auth,
            user_id: user_id,
            voted: "no",
            poll_id: id,
            isMyPoll: isMyPoll,
            poll_name: title,
            poll_results: options
        }
        
        response.render("poll", data);
        
        
    }); //End database query
    
    
   
  
});











app.get("/user", function(request, response) {
    
    //Check to see if user is signed in or not
    if (request.user) {
        auth = "yes";
        var user_id = request.user;
        var mypolls = [];
        
        
       //Query database to get all of authorized user's polls
        poll_collection.find({ user_id: user_id }).toArray(function(err, documents) {
            
            for (var i in documents) {
                
                var poll_id = documents[i]._id;
                var poll_title = documents[i].title;
                mypolls.push([poll_id, poll_title]);
                
            }
            
            var data = 
                {
                    auth: auth,
                    mypolls: mypolls,
                    user_id: user_id
                };
            
     
            response.render("user", data);

            
            
        }); //End database query
         
    }
    else {
        auth = "no";
        
        response.redirect("/");
    }
    

}); //End app.get("/user")





app.get("/newpoll", function(request, response) {
    

    //Check to see if user is signed in or not
    if (request.user) {
        
        auth = "yes";
        var user_id = request.user;
        
        
        var data = 
            {
                auth: auth,
                user_id: request.user
            };
    
        response.render("newpoll", data);
    }
    else {
        auth = "no";
        
        response.redirect("/");
    }
    
 
    
    
    
});






app.get("/updatepoll", function(request, response) {
    
    //If adding a new poll then insert variable will say "yes"
    var insert = request.query.insert;
    //If adding a vote then my_vote variable will say "yes"
    var my_vote = request.query.my_vote;
    //If deleting a poll then delete_poll will say "yes"
    var delete_poll = request.query.delete_poll;
    
    
    //If we are creating a new poll then do this...
    if (insert === "yes") {
        
        var title = request.query.title;
        var user_id = request.query.user_id;


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
                user_id: user_id,
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
    
    
    
    else if (delete_poll === "yes") {
        
        //Get the poll_id
        var id = request.query.poll_id;
        
        //Query the database to delete poll
        poll_collection.remove({ _id: new ObjectId(id) });
        
        response.send("Success");
        
    } //End else if delete_poll
    

    
}); //End update poll





//Start authentication process for a login request
app.get("/login/twitter", passport.authenticate("twitter"));

//Get a success or fail result from the request and redirect to homepage
app.get("/login/twitter/return", passport.authenticate("twitter", { failureRedirect: "/" }), function(request, response) {
    response.redirect("/"); 
});


//End a session by logging out (destroy session cookie) and redirecting to homepage
app.get("/logout", function(request, response) {
    console.log("Logging out");
    request.logout();
    response.redirect("/");
});



app.listen(port);









