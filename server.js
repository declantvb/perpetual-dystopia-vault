var express = require('express');
var app = express();

app.use('/assets/', express.static(__dirname + '/assets'));

app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/index.html');
});

app.listen(3000);