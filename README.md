# mailin.io Mail Interceptor (Webhook)

This repository hold the code for the webserver, webhook for **mailin.io**. **mailin.io** is a SMTP web server that intercepts incoming emails, parses it and POSTs it to a **webhook**. 
The webhook has been implemented in this repository.

To set this up the following steps were followed.

- Buy a domain from NameCheap.
- Buy/setup a host server from Digital Ocean.
- Use the IP address of the above server to create DNS records in the NameCheap DNS management console.
- Install node.js and mailin on host server.
- Create webserver/webhook on port 8080 i.e server.js in this repo.
- Install nginx and configure the default config file. Consult screenshot in mobilephone.
- Sudo service restart nginx.
- Run mailin webhook cmd.

#### What to do next?
- Need to add an HTML parser to parse email body.
- Set up MongoLab MongoDB instance and connect webhook server to it.
- Add parsed email to MongoDB
- Add endpoint to view this data by month/new host server to access this?
