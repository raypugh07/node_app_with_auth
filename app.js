var createError = require('http-errors');
var express = require('express');
var path = require('path');

var logger = require('morgan');
var session = require("express-session");  //imports session library
var okta = require("@okta/okta-sdk-nodejs");
var ExpressOIDC = require("@okta/oidc-middleware").ExpressOIDC;

// route files
const dashboardRouter = require("./routes/dashboard");         
const publicRouter = require("./routes/public");
const usersRouter = require("./routes/users");


var app = express();
var oktaClient = new okta.Client({
  orgUrl: 'https://dev-923232.okta.com',
  token: '00mqxwufzFv3YnHhdrNoB3hZlNGP7p3kfhPRaVojgd'
});
const oidc = new ExpressOIDC({
  issuer: "https://dev-923232.okta.com/oauth2/default",
  client_id: '0oauglc8qlk4NHAGt4x5',
  client_secret: 'GxCZPwvir2MxN3AgAuNP3plfr1zf_PqjUxaq6VHu',
  redirect_uri: 'http://localhost:3000/users/callback',
  scope: "openid profile",
  routes: {
    login: {
      path: "/users/login"
    },
    callback: {
      path: "/users/callback",
      defaultRedirect: "/dashboard"
    }
  }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'fdklgtrmfdgf',
  resave: true,
  saveUninitialized: false
}));  // express-session library middleware
//session library creates secure cryptographically signed cookies so you can store data in a user's browser, gives you a
// simple api for creating and removing cookes and allows you to tweak and configure cookie settings based on what you need to do

app.use(session({
  secret: 'asdf;lkjh3lkjh235l23h5l235kjh',
  resave: true,
  saveUninitialized: false
}));

//enables routes
app.use(oidc.router);
app.use('/', publicRouter);
app.use('/dashboard', addUser, loginRequired, dashboardRouter); // runs loginRequired before dashboardRouter is processed
app.use('/users', usersRouter);

/* app.use((req, res, next) => {
  if (!req.userinfo) {
    return next();
  }

  oktaClient.getUser(req.userinfo.sub)
    .then(user => {
      req.user = user;
      res.locals.user = user;
      next();
    }).catch(err => {
      next(err);
    });
}); */

function addUser(req, res, next) {
  if (!req.userinfo) {
    return next();
  }

  oktaClient.getUser(req.userinfo.sub)
    .then(user => {
      req.user = user;
      res.locals.user = user;
      next();
    }).catch(err => {
      next(err);
    });
};

function loginRequired(req, res, next) {
  if (!req.user) {
    return res.status(401).render("unauthenticated");
  }

  next();
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
