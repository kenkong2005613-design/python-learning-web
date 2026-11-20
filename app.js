// 1. Import Dependencies:
const express = require("express");
const path = require("path");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const authRoute = require('./routes/auth');
const gameRoute = require('./routes/game');
const roomRoute = require('./routes/room');

//2. Initialize the App:
const app = express();

//3. Set Up Middleware:
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Check login status on every request (makes currentUser available in all pages)
app.use(authRoute.isLoggedIn);

//4. Set Up View Engine:
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

//5. Mount Routers
app.use('/', authRoute);        // /register, /login, /logout
app.use('/', gameRoute);        // /dashboard, /quiz, /leaderboard
app.use('/', roomRoute);        // /rooms, /rooms/:code, /scan

// --- Home page ---
app.get('/', (req, res) => {
    res.render('home', { title: 'Control Flow Learning Game' });
});

//6. Start the Server:
app.listen(3000, '0.0.0.0', function () {
    console.log("Control Flow Learning Game running at http://localhost:3000");
    console.log("Other devices on the same WiFi can connect via http://192.168.0.108:3000");
});
