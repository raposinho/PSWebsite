var LocalStrategy   = require('passport-local').Strategy,
    User = require('../model/schemas/User');

module.exports = function(passport) {

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use('register', new LocalStrategy({
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true
        },
        function(req, username, password, done) {

            // verify if the username is already taken
            User.findOne({ 'username' :  username }, function(err, user) {
                if (err)
                    return done(err);
                // check to see if theres already a user with that email
                if (user) {
                    return done(null, false, req.flash('registerMessage', 'That username is already taken.'));
                } else {
                    // create the user
                    var newUser = new User();
                    newUser.username = username;
                    newUser.setPasswords(password);

                    // save the user
                    newUser.save(function(err) {
                        if (err) {
                            throw err;
                        }
                        return done(null, newUser, req.flash('registerMessage', 'success.'));
                    });
                }
            });
        }));

    passport.use('login', new LocalStrategy({
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true
        },
        function(req, username, password, done) {
            // Verify whether the user that is trying to login exists
            User.findOne({ 'username' :  username}, function(err, user) {
                if (err)
                    return done(err);

                //if none was found
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'No user found with that username'));

                //if the password is wrong
                if (!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Wrong password'));

                //return successful user
                return done(null, user);
            });
        }));
};