module.exports = Operation;

function Operation(state, operationId, targetService) {
    this.state = state;
    this.operationId = operationId;
    this.targetService = targetService;
    this.isOver = false;
    this.expirationDate = (function() {
        var curDate = new Date();
        curDate.setMinutes(curDate.getMinutes() + 5);
        return curDate;
    })();
}

Operation.prototype.hasExpired = function(curDate) {
    if(!curDate) {
        curDate = new Date();
    }
    return curDate > this.expirationDate;
}

Operation.prototype.checkIsOver = function() {
    var ret = this.isOver;
    if(!ret) {
        this.isOver = true;
    }
    return ret;
}

Operation.prototype.validateState = function(receivedState) {
    return this.state = receivedState;
}

//counts on a null verification, hence true means an error occurred
Operation.prototype.setWaiter = function(res) {
    if(this.requestTarget) {
        return true;
    }
    this.requestTarget = res;
}

Operation.prototype.getWaiter = function() {
    return this.requestTarget;
}
