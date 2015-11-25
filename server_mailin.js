'use strict';

var async = require('async');
var express = require('express');
var fs = require('fs');
var cheerio = require('cheerio');
var multiparty = require('multiparty');
var util = require('util');


// Helper Functions
function extract(jq, elem) {
	return jq(elem).text().slice(22);
}

/* Make an http server to receive the webhook. */
var server = express();

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
        console.log(util.inspect(fields.mailinMsg, {
            depth: 5
        }));

        console.log('Parsed fields: ' + Object.keys(fields));

        /* Write down the payload for ulterior inspection. */
        async.auto({
            writeParsedMessage: function (cbAuto) {
		console.log('=========== Incoming Email ============');
		var html = JSON.parse(fields.mailinMsg[0]).html;
		
		var $ = cheerio.load(html);
		var info = $('span');
		var status_text = $($('b')[4]).text();
		var obj = {
			fname: 		extract($, info[0]),
			lname: 		extract($, info[1]),
			phone: 		extract($, info[3]),
			email: 		extract($, info[5]),
			p_month:	extract($, info[6]).split('/')[0],
			p_day:		extract($, info[6]).split('/')[1],
			p_year:		extract($, info[6]).split('/')[2],
			p_time: 	extract($, info[7]),
			p_am_pm: 	extract($, info[8]),
			status:		(status_text.indexOf('Approved') === -1) ? 'declined' : 'approved'
		};

		console.log(obj);
		
		// CODE TO ADD obj TO DATABASE
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

