var fs = require('fs');
var cheerio = require('cheerio');
var $;

function extract(jq, elem) {
	return jq(elem).text().slice(22);
}

fs.readFile('mail.html', function(err, data) {
	$ = cheerio.load(data);
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
});
