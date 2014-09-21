var accountController = require('./../controllers/accountController'),
    authorizationController = require('./../controllers/authorizationController'),
    homeController = require('./../controllers/homeController'),
    downloadsController = require('./../controllers/downloadsController');

function applyRoutes(router, passport) {

    //Account routes -> forced SSL
    router.get('/account/loginOrRegister', ensureHttps, rerouteIfLogged, accountController.logInAndRegisterGet);
    router.get('/account', ensureHttps, isLoggedIn, accountController.accountPanel);
    router.get('/account/logout', ensureHttps, accountController.logOut);

    router.post('/account/changePassword', ensureHttps, accountController.changePassword);
    router.post('/account/appLogin', ensureHttps, accountController.appLogin);
    router.post('/account/logIn', ensureHttps, passport.authenticate('login', {
        failureRedirect : '/account/loginOrRegister',
        failureFlash : true
    }), function(req, res) {
        var redirectUrl = req.header('Referer') || '/account';
        res.redirect(redirectUrl);
    });

    router.post('/account/register', ensureHttps, passport.authenticate('register', {
        successRedirect : '/account',
        failureRedirect : '/account/loginOrRegister',
        failureFlash : true
    }));

    //Authorization routes -> all forced to use SSL
    router.get('/registerAuthorizationRequest', ensureHttps, authorizationController.registerRequest);
    router.get('/startAuthorizationRequest', ensureHttps, authorizationController.startAuthorizationRequest);
    router.get('/waitAuthorizationResponse', ensureHttps, authorizationController.waitResponse);
    router.get('/authReturnUri', ensureHttps, authorizationController.startTokenRequest);
    router.post('/renewAccessToken', ensureHttps, authorizationController.renewAccessToken);

    //Downloads routes
    router.get('/downloads/startDownload', ensureHttps, downloadsController.startDownload);
    router.get('/downloads/startDownload2', ensureHttps, downloadsController.startDownload2);

    //Home routes
    router.get('/', ensureHttps, homeController.index);
    router.get('*', ensureHttps, homeController.notFound)
}

//ensure all traffic is made through https
var ensureHttps = (function() {
    if((process.env.NODE_ENV || "development") === 'development') {
        return function(request, response, next) {
            next();
        }
    }
    return function(request, response, next) {
        if (request.headers["x-forwarded-proto"] === "https") {
            return next();
        }
        response.redirect("https://" + request.headers.host + request.url);
    }
})();


//logged in related middleware
function isLoggedIn(request, response, next) {
    //continue the execution in case the user is authenticated
    if (request.isAuthenticated())
        return next();

    //redirect to login page if it failed
    response.redirect('/account/loginOrRegister');
}

//used when accessing login route
function rerouteIfLogged(request, response, next) {
    //if logged, redirect to profile
    if(request.isAuthenticated()) {
        response.redirect('/account');
    } else {
        return next();
    }
}

module.exports = {
    applyRoutes: applyRoutes
}
