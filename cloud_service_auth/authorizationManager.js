module.exports = {
    registerAuthorizationRequest: registerAuthorizationRequest,
    startAuthorizationRequest: startAuthorizationRequest,
    waitAuthorizationResponse: waitAuthorizationResponse,
    verifyIfOperationIsExpected: verifyIfOperationIsExpected,
    startTokenRequest: startTokenRequest,
    rejectedTokenRequest: rejectedTokenRequest,
    renewAccessToken: renewAccessToken
}

var cloudServices = require('./cloudServices'),
    Operation = require('./operation'),
    endResponses = require('./../controllers/utils/endResponses'),
    needle = require('needle'),
    uuid = require('node-uuid'),
    currentOperations = { };

/*
    schedule a task to clean currentOperations that might be left stuck (user didnt pick either accept or reject).
    Operations have an expiration time of 5minutes, and task is run every 1h
*/
setInterval(function() {
    var curDate = new Date();
    for(var operationId in currentOperations) {
        var oper = currentOperations[operationId];
        if(oper.hasExpired(curDate)) {
            currentOperations[operationId] = null;
        }
    }
}, 60 * 60 * 1000);

function generateOperationId() {
    var generatedId = uuid.v4();
    if (!currentOperations[generatedId]) {
        return generatedId;
    }
    // if this id already exists, generate a new one
    return generateOperationId();
}

function registerAuthorizationRequest(targetService, state) {
    //verify if it's a valid cloud service
    if(!cloudServices[targetService]) {
        return null;
    }

    //generate an object representing this authorization, for later use
    var operationId = generateOperationId();
    var operation = new Operation(state, operationId, targetService);
    currentOperations[operationId] = operation;

    return operationId;
}

function startAuthorizationRequest(targetService, state, operationId, res) {
    //validate if the operationId exists, and if the received state is the expected
    if(!currentOperations[operationId] || !currentOperations[operationId].validateState(state)) {
        endResponses.html(400, { reason: 'Either the request wasn\'t expected, or it was badly formatted' }, res, 'authorization/invalid');
        return;
    }

    //relocate the user agent to the cloud services authorization url
    endResponses.redirect(303, cloudServices[targetService].generateAuthorizeURL(operationId), res);
}

//this function should not give any return in case theres, no error... hence the true means an error occured
function waitAuthorizationResponse(state, operationId, res) {
    var operation = currentOperations[operationId];
    /*
        Validations:
            - if operation exists
            - if the state matches the expected
            - if no waiter was already set
     */
    if(!operation) {
        return { result: 'rejected', reason: 'invalid request - unexpected operationId' };
    } else if(!operation.validateState(state)) {
        return { result: 'rejected', reason: 'invalid request - parameters dont match the requirements'};
    } else if(operation.setWaiter(res)) {
        //TODO -> invalidate the current request
        return { result: 'problematic', reason: "invalid request - there's already someone waiting for this request"};
    }
}

function verifyIfOperationIsExpected(operationId) {
    return currentOperations[operationId];
}

function startTokenRequest(targetService, operationId, code) {
    var cloudServiceObj = cloudServices[targetService];
    var oper = currentOperations[operationId];
    if(oper.checkIsOver()) {
        return;
    }

    needle.post(cloudServiceObj.requestTokenURL, cloudServiceObj.generateRequestTokenBody(code), function(err, resp, body) {
        var currentWaiter = oper.getWaiter();
        if(err) {
            endResponses.json(500, { result: "error", reason: "server error"}, currentWaiter);
        } else if(resp.statusCode != 200) {
            endResponses.json(500, { result: "error", reason: "cloud service error"}, currentWaiter);
        } else {
            endResponses.json(200, body, currentWaiter);
        }
    });
}

function rejectedTokenRequest(operationId) {
    endResponses.json(401, { result: "rejected", reason: "user rejected authorization" }, currentOperations[operationId].getWaiter());
}

function renewAccessToken(targetService, refreshToken, res) {
    var cloudServiceObj = cloudServices[targetService];
    needle.post(cloudServiceObj.requestTokenURL, cloudServiceObj.generateRenewAccessToken(refreshToken),
                function(err, resp, body) {
                    if(err) {
                        endResponses(500, { error: 'Unexpected error occured during renewal of access token'}, res);
                    } else if(resp.statusCode == 400) {
                        endResponses.json(401, { reason: 'user removed authorization'}, res);
                    } else {
                        endResponses.json(resp.statusCode, body, res);
                    }
                });
}