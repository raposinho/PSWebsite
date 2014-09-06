var fs = require('fs'),
    path = require('path');

module.exports = {
    startDownload: startDownload
}

function startDownload(req, res) {
    res.setHeader('Content-disposition', 'attachment; filename=CloudomaticClient.jar');
    res.setHeader('Content-type', 'application/java-archive');

    var appDir = path.dirname(require.main.filename);
    fs.createReadStream(appDir + '/public/files/CloudomaticClient.jar').pipe(res);
}