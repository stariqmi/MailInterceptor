'use strict';

var async = require('async');
var express = require('express');
var fs = require('fs');
var cheerio = require('cheerio');
var multiparty = require('multiparty');
var util = require('util');
var mongoose = require('mongoose');
var path = require('path');
var htmlToText = require('html-to-text');

// DB Schema and Model Setup
var appointmentSchema, Appointment, emailSchema, Email;

// DB Connection Setup
mongoose.connect('mongodb://oleg:oleg@ds059284.mongolab.com:59284/mlc_dates');
var db = mongoose.connection;
db.once('open', function() {
	console.log('MongoDB connection established');
	appointmentSchema = mongoose.Schema({
		fname: {type: String, required: '{FNAME} is required'},
		lname: {type: String, required: '{LNAME} is required'},
		phone: {type: String, required: '{PHONE} is required'},
		email: {type: String, required: '{EMAIL} is required'},
		p_month: {type: String, required: '{PMONTH} is required'},
		p_day: {type: String, required: '{PDAY} is required'},
		p_year: {type: String, required: '{PYEAR} is required'},
		p_time: {type: String, required: '{PTIME} is required'},
		p_am_pm: {type: String, required: '{AM/PM} is required'},
		coach: {type: String},
		status: {type: String, required: '{STATUS} is required'},
		date: {type: String, required: '{DATE} is required'},

        // Extra fields required
        pickup_addr:    {type: String},
        pickup_city:    {type: String},
        pickup_zip:     {type: String},
        drop_off_time:  {type: String},
        drop_off_addr:  {type: String},
        total_price:    {type: String},
        hourly_rate:    {type: String},
        hours_req:      {type: String},
        passengers:     {type: String}
	});

	Appointment = mongoose.model('Appointment', appointmentSchema);

    emailSchema = mongoose.Schema({
        email: String
    });

    Email = mongoose.model('Email', emailSchema);
});


// Helper Functions
function extract(jq, elem) {
	var text = jq(elem).text().slice(22);
	// console.log(jq(elem).html());
	console.log(text);
	return text;
}

/* Make an http server to receive the webhook. */
var server = express();

server.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

server.use(express.static('js'));
server.use(express.static('css'));
server.use(express.static('/root/webserver/MailInterceptor/bower_components/bootstrap/dist/css'));

server.get('/calendar_query/:year', function(req, res) {
	console.log(req.params);
	//res.send('Done');
	
	Appointment.find({p_year: req.params.year})
	.exec(function(err, result) {
		console.log(result);
		res.send(result);
	});
});

server.get('/calendar', function(req, res) {
	res.sendFile(path.join(__dirname + '/calendar.html'));
});

server.head('/incoming', function (req, res) {
    console.log('Received head request from webhook.');
    res.send(200);
});

server.post('/incoming', function (req, res) {
    console.log('Receiving webhook incoming email.');

    /* Respond early to avoid timouting the mailin server. */
    // res.send(200);

    /* Parse the multipart form. The attachments are parsed into fields and can
     * be huge, so set the maxFieldsSize accordingly. */
    var form = new multiparty.Form({
        maxFieldsSize: 70000000
    });

    form.on('progress', function () {
        var start = Date.now();
        var lastDisplayedPercentage = -1;
        return function (bytesReceived, bytesExpected) {
            var elapsed = Date.now() - start;
            var percentage = Math.floor(bytesReceived / bytesExpected * 100);
            if (percentage % 20 === 0 && percentage !== lastDisplayedPercentage) {
                lastDisplayedPercentage = percentage;
                console.log('Form upload progress ' +
                    percentage + '% of ' + bytesExpected / 1000000 + 'Mb. ' + elapsed + 'ms');
            }
        };
    }());

    form.parse(req, function (err, fields) {
        


        
        /* Write down the payload for ulterior inspection. */
        async.auto({
            writeParsedMessage: function (cbAuto) {
            	console.log('=========== Incoming Email ============');
                var complete_mail  = JSON.parse(fields.mailinMsg[0]);
            	var subject = complete_mail.subject;
                var from = complete_mail.envelopeFrom.address;
                
                if (subject.indexOf('Transaction') < 0) {       // Add check: && from == "support@usaepay.com"
                    console.log('Irrelevant Email, discard!');
                    return;
                }

                // HTML extraction
                var html = complete_mail.html;
        		
                // Convert to raw text
                var appointment = htmlToText.fromString(html);
        		
                // Save raw data for backup
                var email = new Email({email: appointment});
                email.save(function(err) {
                    if (err) console.log('ERROR: Unable to save email.' + err);
                    else console.log('Email saved to DB');
                });

                try {
            		var details = appointment.split('\n').slice(0,25);
            		
                    // Extract appointment data
            		for (var i = 0; i < details.length; i++) {
                        // First Name: Salman Tariq -> Salman Tariq
            			var cut_at = details[i].indexOf(':') + 2; // 2: 1 to eliminate the : itself and 1 to eliminate the extra initial space
            			details[i] = details[i].substring(cut_at);
            		}
            		
            		console.log(details);
    	
    		
                    var date_regex = /[\\\/-]/;
                    var date_components = details[6].split(date_regex);

                	var obj = {
                		fname: 		details[0],
                		lname: 		details[1],
                		phone: 		details[3].slice(0, details[3].indexOf('[') - 1),
                		email: 		details[5].slice(0, details[5].indexOf('[') - 1),
                		p_month:	date_components[0].toString(),
                		p_day:		date_components[1].toString(),
                		p_year:		date_components[2].toString().replace('20',''),
                		p_time: 	details[7],
                		p_am_pm: 	details[8].toUpperCase(),
                		coach: 		details[20],
                		status:		(subject.indexOf('Approved') === -1) ? 0 : 1,
                		date:		'20' + date_components[2].replace('20', '') + '-' + date_components[0] + '-' + date_components[1],

                        // Extra Fields required
                        pickup_addr:    details[9],
                        pickup_city:    details[10],
                        pickup_zip:     details[11],
                        drop_off_time:  details[12],
                        drop_off_addr:  details[13],
                        total_price:    details[16],
                        hourly_rate:    details[17],
                        hours_req:      details[18],
                        passengers:     details[14]
                	};

                	console.log(obj);
                	
                	// CODE TO ADD obj TO DATABASE
                	var app = new Appointment(obj);
                	app.save(function(err) {
                		if(err) console.log('ERROR: Unable to save.' + err);
                		else console.log('Appointment saved to DB');
                	});
                }
                catch (e) {
                    console.log(e);
                }
		
            },
            writeAttachments: function (cbAuto) {
                var msg = JSON.parse(fields.mailinMsg);
                async.eachLimit(msg.attachments, 3, function (attachment, cbEach) {
                    fs.writeFile(attachment.generatedFileName, fields[attachment.generatedFileName], 'base64', cbEach);
                }, cbAuto);
            }
        }, function (err) {
            if (err) {
                console.log(err.stack);
                res.sendStatus(500, 'Unable to write payload');
            } else {
                console.log('Webhook payload written.');
                res.sendStatus(200);
            }
        });
    });
});

server.listen(8080, function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log('Http server listening on port 8080');
    }
});

