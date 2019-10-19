const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');


// Load Models
require('./models/User');
require('./models/Story');

// Passport config
require('./config/passport')(passport);

// Load Routes
const auth = require('./routes/auth');
const index = require('./routes/index');
const sotries = require('./routes/stories');

// Load keys
const keys = require('./config/keys');

// Handlebars Helpers
const {
    truncate,
    stripTags,
    formatDate,
    select,
    editIcon,
    editHelper
} = require('./helpers/hbs');

// Mongoose Connect
mongoose.connect(keys.mongoURI, {
        useNewUrlParser: true
    })
    .then(() => console.log('MongoDB Connected....'))
    .catch(err => console.log(err)
);

// Map global promise
mongoose.Promise = global.Promise;

const app = express();

// Method Override Middleware
app.use(methodOverride('_method'));

// BodyParser Middleware
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())

// Handlebars Middleware
app.engine('handlebars', exphbs({
    helpers: {
        truncate: truncate,
        stripTags: stripTags,
        formatDate: formatDate,
        select: select,
        editIcon: editIcon,
        editHelper: editHelper
    },
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// CookieParser middleware
app.use(cookieParser());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}))

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Set global vars
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});


// Use Routes
app.use('/auth', auth);
app.use('/', index);
app.use('/stories', sotries);


app.use(express.static(path.join(__dirname, '/public')));


// 404 pages
app.use(function(req, res, next){
    res.status(404);
  
    // respond with html page
    if (req.accepts('html')) {
      res.render('layouts/404',{layout: '404.handlebars', url: req.url });
      return;
    }
});


const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});