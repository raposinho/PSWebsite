var responseFormatter = require('./utils/ResponseFormatter.js')
var endResponses = require('./utils/endResponses');

module.exports = {
    index: index,
    notFound: notFound
}

function index(req, res) {
    endResponses.html(200, responseFormatter.commonFields(req, 'Cloudomatic Home'), res, 'home/index');
}

function notFound(req, res) {
    endResponses.html(200, responseFormatter.commonFields(req, 'Not Found'), res, 'home/notFound');
}
