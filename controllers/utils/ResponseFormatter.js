module.exports = {
    commonFields: function(req, title) {
        return {
            isLogged: req.isAuthenticated(),
            title: title
        }
    },
    commonAuthorizationFields: function(req, title, targetService, message) {
        var fields = this.commonFields(req, title);
        fields.targetService = targetService;
        fields.message = message;
        return fields;
    }
}