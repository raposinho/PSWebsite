var authorizationManager = require('./../cloud_service_auth/authorizationManager'),
    endResponses = require('./utils/endResponses'),
    responseFormatter = require('./utils/ResponseFormatter');

module.exports = {
    registerRequest: registerRequest,
    startAuthorizationRequest: startAuthorizationRequest,
    waitResponse: waitResponse,
    startTokenRequest: startTokenRequest,
    renewAccessToken: renewAccessToken
}

function getStateAndTarget(req, res, failCallback, failArgs) {
    //service where authorization is to be made
    var targetService = req.query.targetService;
    var state = req.query.state;
    //if scope ain't present, reject the request
    if(!state || !targetService) {
        failCallback(400, { result: 'failed', reason: 'invalid request - state and targetService fields must be present'}, res, failArgs);
        return null;
    }
    return {
        targetService: targetService,
        state: state
    }
}

function getStateAndTargetAndOperationId(req, res, failCallback, failArgs) {
    var reqInfo = getStateAndTarget(req, res, failArgs);
    reqInfo.operationId = req.query.operationId;
    if(!reqInfo.operationId) {
        failCallback(400, { result: 'failed', reason: 'invalid request - operationId field must be present'}, res, failArgs);
        return null;
    }
    return reqInfo;
}

function registerRequest(req, res) {
    var reqInfo = getStateAndTarget(req, res, endResponses.json);
    if(!reqInfo) {
        return;
    }
    //start authorization request, and obtain id for later use
    var operationId = authorizationManager.registerAuthorizationRequest(reqInfo.targetService, reqInfo.state);
    if(!operationId) {
        endResponses.json(400, { result: 'failed', reason: 'invalid request - requested cloud service is not supported'}, res);
        return;
    }
    endResponses.json(200, { result: 'started',operationId: operationId}, res);
}

function startAuthorizationRequest(req, res) {
    var reqInfo = getStateAndTargetAndOperationId(req, res);
    if(!reqInfo) {
        return;
    }
    //redirect to authorization page in case validations are correct
    authorizationManager.startAuthorizationRequest(reqInfo.targetService, reqInfo.state, reqInfo.operationId, res);
}

function waitResponse(req, res) {
    var reqInfo = getStateAndTargetAndOperationId(req, res, endResponses.json);
    if(!reqInfo) {
        return;
    }
    //start waiting for user to finish his authentication
    var error = authorizationManager.waitAuthorizationResponse(reqInfo.state, reqInfo.operationId, res);
    if(error) {
        endResponses.json(400, error, res);
    }
    //if there's no error, long polling has been started
}

/*
        function called when user either allows/rejects the access to cloudomatic, it contains the following flow:
            1 -> verify if the needed parameters are present (targetService and OperationId)
            2 -> verify if this operation is expected (making sure it's a requested that followed the right flow")
            3 -> depending on user action:
                a) allowed access: a success view is shown to the user, and a token request starts to later send to the current waiter
                b) rejected access: a rejected view is shown to the user
 */
function startTokenRequest(req, res) {
    var reqInfo = getStateAndTarget(req, res, endResponses.json);
    if(!reqInfo) {
        return;
    }
    //TODO -> verify if it was invalidated

    //in this request, "state" parameter should be the operationId from when the operation was registered
    if(!authorizationManager.verifyIfOperationIsExpected(reqInfo.state)) {
        var items = responseFormatter.commonAuthorizationFields(req,
                                                                'Unexpected Request',
                                                                reqInfo.targetService,
                                                                'failed due an this being an unexpected request');
        endResponses.html(400, items, res, 'authorization/commonAuthorization');

    //verify if the user rejected the application
    } else if(req.query.error) {
        authorizationManager.rejectedTokenRequest(reqInfo.state);
        var items = responseFormatter.commonAuthorizationFields(req,
                                                                'Authorization failure',
                                                                reqInfo.targetService,
                                                                'failed due to user rejection');

        endResponses.html(200, items, res, 'authorization/commonAuthorization');
    } else {
        //request token, before giving an answer to user agent
        authorizationManager.startTokenRequest(reqInfo.targetService, reqInfo.state, req.query.code);
        var items = responseFormatter.commonAuthorizationFields(req,
                                                                'Authorization success',
                                                                reqInfo.targetService,
                                                                'was successful, finishing preparations');
        endResponses.html(200, items, res, 'authorization/commonAuthorization');
    }
}

function renewAccessToken(req, res) {
    var targetService = req.body.targetService;
    var refreshToken = req.body.refreshToken;
    if(!targetService || !refreshToken) {
        endResponses.json(400, {
                                 result: 'failed',
                                 reason:'invalid request - targetService and refresh token fields must be present'
                               });
        return;
    }
    authorizationManager.renewAccessToken(targetService, refreshToken, res);
}
