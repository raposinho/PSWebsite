//TODO - modificar o generate/validate state

module.exports = {
    Dropbox: new CloudService('Dropbox',
                              'g2yj5hbejsv42pn',
                              'zs537f38neez48y',
                              'https://www.dropbox.com/1/oauth2/authorize?',
                              null,
                              'https://api.dropbox.com/1/oauth2/token',
                              false),

    MeoCloud: new CloudService('MeoCloud',
                               'e762e198-b48f-4c9e-9e8b-0502013f1cda',
                               '279019708031393793766616709878162492074',
                               'https://meocloud.pt/oauth2/authorize?',
                               null,
                               'https://meocloud.pt/oauth2/token',
                               true),

    GoogleDrive: new CloudService('GoogleDrive',
                                  '209099088248-psu00av3064m95ndqi5a5qcd2rrqapld.apps.googleusercontent.com',
                                  'j2dqDk-5vynJEzbVhBEijZbR',
                                  'https://accounts.google.com/o/oauth2/auth?access_type=offline&approval_prompt=force&',
                                  function addScope(commonAuthorizeUrlWithQuery) {
                                      return commonAuthorizeUrlWithQuery + '&scope=https://www.googleapis.com/auth/drive'
                                  },
                                  'https://accounts.google.com/o/oauth2/token',
                                  true)
}

var curHost = process.env.CUR_HOST || 'http://localhost:8000';

//authorizationArgsFunc -> some services require extra parameters, ex: google drive needs scope
function CloudService(serviceName, client_id, client_secret, authorizationURL,
                      authorizationArgsFunc, requestTokenURL, supportsRefreshToken) {
    this.serviceName = serviceName;
    this.client_id = client_id;
    this.client_secret = client_secret;
    this.authorizationURL = authorizationURL;
    this.authorizationArgsFunc = authorizationArgsFunc
    this.requestTokenURL = requestTokenURL;
    this.supportsRefreshToken = supportsRefreshToken;
}

CloudService.prototype.generateAuthorizeURL = function(operationId) {
    var url = this.authorizationURL +
              'response_type=code' +
              '&client_id=' + this.client_id +
              '&redirect_uri=' + curHost + '/authReturnUri?targetService=' + this.serviceName +
              '&state=' + operationId +
              '&force_reapprove=false';
    if(this.authorizationArgsFunc) {
        url = this.authorizationArgsFunc(url);
    }
    return url;
}

function getCredentials(cloudObj) {
    return 'client_id=' + cloudObj.client_id +
           '&client_secret=' + cloudObj.client_secret;
}


CloudService.prototype.generateRequestTokenBody = function(code) {
    return getCredentials(this) +
           '&grant_type=authorization_code' +
           '&code=' + code +
           '&redirect_uri=' + curHost + '/authReturnUri?targetService=' + this.serviceName;
}

CloudService.prototype.generateRenewAccessToken = function(refreshToken) {
    if(!this.supportsRefreshToken) {
        throw({ reason: 'Operation not supported by the target service'});
    }
    return getCredentials(this) +
           '&grant_type=refresh_token' +
           '&refresh_token=' + refreshToken;
}