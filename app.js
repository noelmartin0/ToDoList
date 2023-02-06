//Database used ToDoListDB 
//Collections used are User, List and Items
//Used DBMS is MongoDB and connectivity used is mongoose

//REQUIRED NPM PACKAGES
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash"); //string manipulation module
const md5 = require('md5');

const app = express();
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static("public")); //TO ACCESS CSS FILES FROM PUBLIC FOLDER
app.set("view engine", "ejs"); //TO ACCESS EJS FILES FROM VIEW FOLDER

//CONNECTING TO MONGO DB SERVER
mongoose.set("strictQuery", false);
mongoose.connect(process.env.DB_LINK, {
  useNewUrlParser: true,
});

//Schema is used only for format
const itemSchema = {
  name: String
};
//model is similar to class concept
const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your ToDoList!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/list", function (req, res) {
    Item.find(function (err, foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Sucessfuly saved default items to DB");
          }
        });
        res.redirect("/list");
      }
      else {
      res.render("list", { listTitle: "Today", newListItem: foundItems });
      }
    });
  });


app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item  = new Item({
    name: itemName
  });
  console.log(listName);
  if(listName === "Today") { 
    item.save();
    res.redirect("/list");
  }
  else{
    List.findOne({name: listName}, function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      console.log(listName);
      res.redirect("/"+listName);
    })
  }
});

app.post("/delete", function(req,res){
  const getID = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndRemove(getID, function(err){
      if(!err) {
        console.log("Deleted Successfuly");
        res.redirect("/list");
      }
    });
  }
  else {
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: getID}}},function(err, foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }
});

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  list: [listSchema]
});

const User = new mongoose.model("User",userSchema);

app.get("/", function(req,res){
  res.render("home");
});

app.post("/home", function(req,res){
  res.render("home");
})

app.get("/login", function(req,res){
  res.render("login");
});

app.get("/register", function(req,res){
  res.render("register");
});

app.get("/error", function(req,res){
  res.render("error");
});

app.post("/register", function(req,res){
  const newUser = new User({
      username: req.body.fullname,
      email: req.body.username,
      password: md5(req.body.password),  
  });
  newUser.save(function(err) {
      if(!err){
          res.redirect("/"+newUser.username);
      }
      else{
          console.log(err);
      }
  })
})

app.post("/login", function(req,res){
  const username = req.body.username; 
  const password = md5(req.body.password);  
  User.findOne({email: username}, function(err, foundUser){ 
      if(err){
          console.log(err);
      }
      else{
          if(foundUser.password === password){
              res.redirect("/"+foundUser.username)
          }
          else{
            res.render("error");
          }
      }
  });
});

app.get("/:page", function (req, res) { 
  const pageName = _.startCase(req.params.page); 
  List.findOne({name: pageName}, function(err, foundList){ 
    if(!err) {
      if(!foundList) {
        const list = new List({
          name: pageName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+pageName); 
      }
      else {
        res.render("list", { listTitle: foundList.name, newListItem: foundList.items})
      }
    }
  })
 
});


app.listen(3000, function () {
  console.log("Server is running on Port 3000");
});
