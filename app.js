require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const { urlencoded } = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5")
// const bcrypt = require("bcrypt");
// const saltRounds = 8;
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

mongoose.connect("mongodb+srv://sameergarg006:AmYb7vRCSDKK8Z5Q@cluster0.1xrbco1.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true });

mongoose.set('strictQuery', true);

const astraUserSchema = new mongoose.Schema({
    name: String,
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

// Passport Serializer Deserializer --
passport.serializeUser(function (astraUser, done) {
    done(null, astraUser.id);
});
passport.deserializeUser(function (id, done) {
    astraUser.findById(id, function (err, astraUser) {
        done(err, astraUser);
    });
});

// Login with Google --
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:8000/auth/google/posts",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
},
    function (accessToken, refreshToken, profile, cb) {
        // console.log(profile);
        astraUser.findOrCreate({ googleId: profile.id }, function (err, astraUser) {
            return cb(err, astraUser);
        });
    }
));


// Get Requests --
app.get("/", function (req, res) {
    res.render("home");
});

app.get("/register", function (req, res) {
    res.render("register");
});
app.get("/login", function (req, res) {
    res.render("register");
});
app.get("/auth/google",
    passport.authenticate("google", { scope: ['profile'] })
);

app.get("/auth/google/posts",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function (req, res) {
        res.redirect('/posts');
    });

app.get("/posts", function (req, res) {
    if (req.user) {
        userPost.find({}, function (err, foundUsers) {
            if (err) {
                console.log(err);
            } else {
                if (foundUsers) {
                    res.render("posts", { userPosts: foundUsers });
                }
            }
        });
    } else {
        res.redirect("/login")
    }

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

// Post Requests --
app.post("/register", function (req, res) {
    astraUser.register({ username: req.body.username, name: req.body.name }, req.body.password, function (err, astraUser) {
        if (err) {
            console.log(err);
            res.redirect("/login");
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
    console.log("Server started in 8000");
});