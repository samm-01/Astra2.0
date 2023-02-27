const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const { urlencoded } = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5")
const bcrypt = require("bcrypt");
const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));


app.use(session({
    secret: "Our Little Secret.",
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/astraUserDB", { useNewUrlParser: true });
mongoose.set('strictQuery', true);

const astraUserSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    title: String,
    body: String,
});

astraUserSchema.plugin(passportLocalMongoose);
astraUserSchema.plugin(findOrCreate);

const astraUser = new mongoose.model("astraUser", astraUserSchema);
const userPost = new mongoose.model("userPost", astraUserSchema);

passport.use(astraUser.createStrategy());

passport.serializeUser(function (astraUser, done) {
    done(null, astraUser.id);
});
passport.deserializeUser(function (id, done) {
    astraUser.findById(id, function (err, astraUser) {
        done(err, astraUser);
    });
});

// astraUserSchema.plugin(encrypt, { encryptedFields: ["password"] });


app.get("/", function (req, res) {
    res.render("home");
});

app.get("/register", function (req, res) {
    res.render("register");
});
app.get("/login", function (req, res) {
    res.render("login");
});
app.get("/posts", function (req, res) {
    // res.render("posts");
    userPost.find({}, function (err, foundUsers) {
        if (err) {
            console.log(err);
        } else {
            if (foundUsers) {
                res.render("posts", { userPosts: foundUsers });
            }


        }
    });
});
app.get("/check", function (req, res) {
    res.render("check");
});

app.get('/logout', function (req, res) {
    req.logout(function (err) {
        if (err) {
            return err
        }
        res.redirect('/');
    });
});


app.post("/register", function (req, res) {

    // bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    //     const newUser = new astraUser({
    //         email: req.body.username,
    //         // password: md5(req.body.password),
    //         password: hash
    //     });
    //     newUser.save(function (err) {
    //         if (err) {
    //             console.log(err);
    //         } else {
    //             res.render("posts");
    //         }
    //     });
    // });
    astraUser.register({ username: req.body.username }, req.body.password, function (err, astraUser) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/posts");
            });
        }
    });
});

app.post("/login", function (req, res) {
    const astrauser = new astraUser({
        username: req.body.username,
        password: req.body.password
    });
    req.login(astrauser, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/posts");
            });
        }
    })
    // const username = req.body.username;
    // const password = (req.body.password)

    // astraUser.findOne({ email: username }, function (err, foundUser) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         if (foundUser) {
    //             console.log(foundUser.email);
    //             res.redirect("/posts");
    //         }
    //     }
    // });
});
app.post("/posts", function (req, res) {
    const newPost = new userPost({
        title: req.body.title,
        body: req.body.post
    });
    newPost.save(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/posts");
        }
    })
});

app.listen(8000, function () {
    console.log("Server started in 3000");
});