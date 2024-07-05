var express = require('express');
var router = express.Router();
const passport = require("passport");//auth code
const flash = require("connect-flash");//for flash messages.

//Importing user and post schema
const UserModel = require("./users");//schema
const PostModel = require("./posts");//schema
const upload = require('./multer');//importing multer.js file

// These two lines will allow user to login
const localStrategy = require("passport-local").Strategy;//auth code 
passport.use(new localStrategy(UserModel.authenticate()));//login via email//auth code

router.get("/",(req,res)=>{//This page contains register form
  res.render("index");
})

router.get("/feed",(req,res)=>{
  res.render("feeds");
})

router.get("/profile/posts",isLoggedIn,async (req,res)=>{
  const user = await UserModel.findOne({
    username:req.session.passport.user
  })
  .populate('posts');
  res.render("posts",{user});
})

//Uploading profilePhoto
router.post("/profileUpload",isLoggedIn, upload.single("profileImage"),async(req,res)=>{
  if(!req.file){
    res.status(404).send("No files were uploaded.");
  }
  //Uploading profile image in the user.dp collection
  const user = await UserModel.findOne({
    username: req.session.passport.user,
  });
  user.dp = req.file.filename; //req.file.filename gives the name of the file.
  await user.save();
  res.redirect("/profile");
})

//File upload
router.post("/upload",isLoggedIn,upload.single("uploadPost"),async(req,res)=>{
  if(!req.file){
    res.status(404).send("No files were uploaded.");
  }
  //uplaoding userid in post and postid in user, and also image, caption in post collection.
  const user = await UserModel.findOne({
    username: req.session.passport.user,
  });
  const postData = await PostModel.create({
    caption:req.body.caption,
    image:req.file.filename,
    user:user._id,
  })

  // In req.body.caption, the caption is the "name" given in the form tag.
  // req.file.filename, gives the name of the file uploaded.
  user.posts.push(postData._id);
  await user.save();
  res.redirect("/profile");
})

router.get("/login",(req,res)=>{//login page
  res.render("login",{error: req.flash("error")});
})

router.post("/register",(req,res)=>{//auth code
  const userData = new UserModel({
    username: req.body.username,//In req.body.username, the username is the name given in the form tag in ejs.
    email: req.body.email,
  })
  UserModel.register(userData,req.body.password)
  .then(()=>{
    passport.authenticate("local")(req,res,()=>{
      res.redirect("/profile");
    })
  })
  .catch(err => {
    // console.error("Registration error:", err);
    res.redirect("/");
  });
});//auth code

router.post("/login", passport.authenticate("local", {//auth code
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash:true,
}));//auth code

router.get('/logout', function(req, res, next){//auth code
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});//auth code

function isLoggedIn(req,res,next){//auth code
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/");
}//auth code

//Profile page will not open until you are logged in.
router.get("/profile",isLoggedIn,async(req,res)=>{//auth code.
  const user = await UserModel.findOne({
    username:req.session.passport.user//If loggedIn the user is stored in "req.session.passport.user"
  })//username is an object having user information defined in the schema.
  .populate("posts");
  res.render("profile", {user});//Passing the userObject.
})//auth code
//Route to render profile page (accessible only if logged in)

module.exports = router;