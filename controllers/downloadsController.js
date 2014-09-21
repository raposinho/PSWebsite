var fs = require('fs'),
    path = require('path');

module.exports = {
    startDownload: startDownload
}

function startDownload(req, res) {
    res.setHeader('Content-disposition', 'attachment; filename=CloudomaticClient.zip');
    res.setHeader('Content-type', 'application/zip');

    var appDir = path.dirname(require.main.filename);
    fs.createReadStream(appDir + '/public/files/CloudomaticClient.zip').pipe(res);
}
