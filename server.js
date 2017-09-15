/**
 * Created by JIAQIANG on 2016/03/17.
 */
var express = require('express');
var app = express();

app.use('/app',express.static('app'));
app.get('/',function(req, res){
    res.redirect('/app/index.html');
});

var server = app.listen(3333, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Server started at http://%s:%s', host, port);
});