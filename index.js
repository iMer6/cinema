let express = require("express");
const ejs = require("ejs");
const bodyParser = require('body-parser');
const session = require('express-session');

let app = express();

app.use('/public', express.static('public'));

app.set("view engine", "ejs");

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
    name: 'session_id',
    secret: 'key_cinema',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 86_400_000
    }
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.use('/film', require("./routes/films"));
app.use('/cinema', require("./routes/cinemas"));
app.use('/session', require("./routes/sessions"));
app.use('/auth', require("./routes/auth"));
app.use('/booking', require("./routes/booking"));


app.listen(8000, () => {
    console.log(`Application successfully started and Listening on port 8000.
        http://localhost:8000`)
});
