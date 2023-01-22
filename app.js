//jshint esversion:6
require('dotenv').config();
const express = require("express");
const https = require("https");
const {getQuestion, getPersonName} = require('random-questions');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));


app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-muskan:"+process.env.PASSWORD+"@cluster0.bmbo9.mongodb.net/easeengDB", {useNewUrlParser: true, useUnifiedTopology: true} );
mongoose.set("useCreateIndex", true);



const itemsSchema=new mongoose.Schema({
  email:String,
  password:String,
});

itemsSchema.plugin(passportLocalMongoose);

const Item = mongoose.model("Item", itemsSchema);

passport.use(Item.createStrategy());
passport.serializeUser(function(user, done){
  done(null, user.id);
});
passport.deserializeUser(function(id, done){
  Item.findById(id, function(err, user){
    done(err, user);
  });
});

var today = new Date();
var title = "";
var poet = "";
var poem = "";
var year=today.getFullYear();
var islogin=false;

app.get("/", function(req, res){
  res.render("informationpage", {yearmat:year, btntype:islogin});
});


app.get("/login", function(req, res){
  res.render("login", {yearmat:year, btntype:islogin});
});

app.get("/register", function(req, res){
  res.render("register",{yearmat:year, btntype:islogin});
});


//---------------------------------------------------------------------------------------------------------


app.get("/matrix", function(req, res){
  if(req.isAuthenticated()){
    islogin=true;
    Item.findById(req.user.id, function(err, foundUser){
      if(err){
        console.log(err);
        res.redirect("/login");
      }
      else{
        if(foundUser){
          res.render("matrix",{yearmat:year, btntype:islogin, Title:title, Poet:poet, Poem:poem});
        }
      }
    });
  }
});

app.post("/matrix", function(req, res){
  
});

app.get("/poem", function(req, res){
    let chunks = [];
    https.get("https://dpsapi.onrender.com/poems", function(response){
      response.on('data', function(data) {
        chunks.push(data);
      }).on('end', function() {
        let data   = Buffer.concat(chunks);
        let qdata = JSON.parse(data);
         var ind=Math.floor(Math.random() * 7);
         title = qdata[ind].title;
         poet = qdata[ind].poet;
         poem = qdata[ind].poem;
      });
    });
    res.redirect("/matrix");
});

app.get("/story", function(req, res){
  https.get("https://dpsapi.onrender.com/story", function(response){
    let chunks = [];
    response.on('data', function(data) {
      chunks.push(data);
    }).on('end', function() {
      let data   = Buffer.concat(chunks);
      let qdata = JSON.parse(data);
       var ind=Math.floor(Math.random() * 8);
       title = qdata[ind].title;
       poet = qdata[ind].author;
       poem = qdata[ind].story;
    });
   });
   res.redirect("/matrix");
});

app.get("/dialogue", function(req, res){
  https.get("https://dpsapi.onrender.com/dialogue", function(response){
    let chunks = [];
    response.on('data', function(data) {
      chunks.push(data);
    }).on('end', function() {
      let data   = Buffer.concat(chunks);
      let qdata = JSON.parse(data);
       var ind=Math.floor(Math.random() * 28);
       title = qdata[ind].name;
       poet = qdata[ind].actor;
       poem = qdata[ind].script;
    });
   });
   res.redirect("/matrix");
});


//--------------------------------------------------------------------------------------------------------

app.get("/logout", function(req, res){
  req.logout();
  islogin=false;
  res.redirect("/");
});

app.post("/login", function(req, res){
  const user = new Item({
    usename: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/matrix");
      });
    }
  });
});

app.post("/register", function(req, res){
  Item.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/matrix");
      });
    }
  });
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function (){
  console.log("server started on port 3000");
});
