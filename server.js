var express = require('express');
var app = express();

app.use('/lib/', express.static(__dirname + '/lib'));
app.use('/dist/', express.static(__dirname + '/dist'));

app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/index.html');
});

app.listen(3000);