var endResponses = require('./utils/endResponses'),
    User = require("./../model/schemas/User"),
    responseFormatter = require('./utils/ResponseFormatter.js');

var constants = {
    CHANGE_MESSAGE: 'changeMessage',
    IS_CHANGE_ERROR: 'isChangeError'
}


module.exports = {
    appLogin: appLogin,
    logInAndRegisterGet: logInAndRegisterGet,
    logOut: logOut,
    changePassword: changePassword,
    accountPanel: accountPanel
}

function appLogin(req, res) {
    var userName = req.body.username;
    var password = req.body.password;

    if (!userName || !password) {
        endResponses.json(400, { isAuthorized: false, response: 'Wrongly formatted request' }, res);
        return;
    }

    User.findOne({ username: userName }, function (err, user) {
        if(err) {
            endResponses.json(500, { isAuthorized: false, response: 'unexpected error resources' }, res);
        } else {
            if(!user) {
                endResponses.json(403, { isAuthorized: false, response: 'No user found with that username' }, res);
            } else if(!user.validPassword(password)) {
                endResponses.json(403, { isAuthorized: false, response: 'The given password is incorrect' }, res);
            } else {
                endResponses.json(200,
                                  {
                                      isAuthorized: true,
                                      response: user.saltApplicationPassword
                                  },
                                  res);
            }
        }
    });
}

function logInAndRegisterGet(req, res) {
    var items = responseFormatter.commonFields(req, 'Cloudomatic - Login');
    items.loginMessage = req.flash('loginMessage');
    items.registerMessage = req.flash('registerMessage');
    endResponses.html(200, items, res, 'account/loginOrRegister');
}

function logOut(req, res) {
    req.logout();
    res.redirect('/');
}

function accountPanel(req, res) {
    var items = responseFormatter.commonFields(req, 'AccountPanel - Account Panel');
    items.changeMessage = req.flash(constants.CHANGE_MESSAGE);
    items.isChangeError = req.flash(constants.IS_CHANGE_ERROR);
    endResponses.html(200, items, res, 'account/accountPanel');
}

function changePassword(req, res) {
    var newPassword = req.body.newPassword;
    var verifyPassword = req.body.verifyPassword;

    if(verifyPassword === '' || newPassword === '') {
        return onChangeEnding(req, res, 'Neither field can be empty', true);
    }

    if(verifyPassword !== newPassword) {
        return onChangeEnding(req, res, 'Fields don\'t match', true);
    }

    if(req.user.validPassword(newPassword)) {
        return onChangeEnding(req, res, 'New password is the same as the old one', true);
    }

    req.user.setPasswords(newPassword);
    req.user.save(function(err) {
        if (err) {
            return onChangeEnding(req, res, 'Fields don\'t match', true);
        }
        onChangeEnding(req, res, 'Succeeded in replacing password', false);
    });
}

function onChangeEnding(req, res, message, isError) {
    req.flash(constants.CHANGE_MESSAGE, message);
    req.flash(constants.IS_CHANGE_ERROR, isError);
    res.redirect("/account");
}