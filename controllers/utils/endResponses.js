module.exports = {
    html: html,
    json: json,
    redirect: redirect
}

function json(status, obj, res) {
    res.statusCode = status;
    res.setHeader('Content-type', 'application/json');
    res.end(JSON.stringify(obj));
}

function html(status, obj, res, view) {
    res.statusCode = status;
    res.setHeader('Content-type', 'text/html');
    res.render(view, obj);
}

function redirect(status, location, res) {
    res.statusCode = status;
    res.setHeader('Location', location);
    res.end();
}