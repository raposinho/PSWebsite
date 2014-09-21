var fs = require('fs'),
    path = require('path');

module.exports = {
    startDownload: startDownload,
    startDownload2: startDownload2
}

function startDownload(req, res) {
    res.setHeader('Content-disposition', 'attachment; filename=CloudomaticClient.zip');
    res.setHeader('Content-type', 'application/zip');

    var appDir = path.dirname(require.main.filename);
    fs.createReadStream(appDir + '/public/files/CloudomaticClient.zip').pipe(res);
}

function startDownload2(req, res) {
    res.setHeader('Content-disposition', 'attachment; filename=CloudomaticClient2.png');
    res.setHeader('Content-type', 'image/png');

    var appDir = path.dirname(require.main.filename);
    fs.createReadStream(appDir + '/public/files/CloudomaticClient2.png').pipe(res);
}
