var express = require('express');
var formidable = require('formidable');

var app = express();

app.post('/incoming', function(req, res) {
	console.log('============= INCOMING ==========');

	var form  = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		var mail = {all: JSON.parse(fields.mailinMsg)};
		mail.html = mail.all.html;
		mail.from = mail.all.envelopeFrom.address;
		mail.to = mail.all.envelopeTo[0].address;

		console.log('From: ' + mail.from);
		console.log('To:   ' + mail.to);
		console.log('Mail: (HTML) ' + mail.html); 
		
	});	

	res.end('Thank You!');
});

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Mailin Webhook Server listening at http://%s:%s', host, port);
});
