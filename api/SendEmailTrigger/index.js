const { v4: uuidv4 } = require('uuid');
const { TableServiceClient, AzureNamedKeyCredential, TableClient } = require("@azure/data-tables");
const { Auth, google } = require('googleapis');
const { authenticate } = require('@google-cloud/local-auth');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

async function insertAuthenticationRequest(context, email) {
    try {
        const account = process.env.TABLES_STORAGE_ACCOUNT_NAME;
        const accountKey = process.env.TABLES_PRIMARY_STORAGE_ACCOUNT_KEY;
        const suffix = process.env.TABLES_STORAGE_ENDPOINT_SUFFIX;
    
        const url = 'https://' + account + '.table.' + suffix;
    
        const credential = new AzureNamedKeyCredential(account, accountKey);
        const serviceClient = new TableServiceClient(
            url,
            credential
        );
    
        const tableName = 'authenticationrequests';
        await serviceClient.createTable(tableName, {
            onResponse: (response) => {
                if (response.status === 409) {
                    context.log('Table authenticationrequests already exists');
                }
            }
        });
        const tableClient = new TableClient(url, tableName, credential);

        let entity = {
            partitionKey: "Prod",
            rowKey: uuidv4(),
            email: email
        };
        await tableClient.createEntity(entity);
        return entity;
    } catch (err) {
        context.log(err);
        throw err;
    }
}

async function insertPollingRequest(context, authenticationRequestID) {
    try {
        const account = process.env.TABLES_STORAGE_ACCOUNT_NAME;
        const accountKey = process.env.TABLES_PRIMARY_STORAGE_ACCOUNT_KEY;
        const suffix = process.env.TABLES_STORAGE_ENDPOINT_SUFFIX;
    
        const url = 'https://' + account + '.table.' + suffix;
    
        const credential = new AzureNamedKeyCredential(account, accountKey);
        const serviceClient = new TableServiceClient(
            url,
            credential
        );
    
        const tableName = 'pollingrequests';
        await serviceClient.createTable(tableName, {
            onResponse: (response) => {
                if (response.status === 409) {
                    context.log('Table pollingrequests already exists');
                }
            }
        });
        const tableClient = new TableClient(url, tableName, credential);

        let entity = {
            partitionKey: "Prod",
            rowKey: uuidv4(),
            authenticationRequestID: authenticationRequestID
        };
        await tableClient.createEntity(entity);
        return entity;
    } catch (err) {
        context.log(err);
        throw err;
    }
}

async function sendMail(context, authenticationRequest) {
    try {
        const credentialsBase64 = process.env.CLIENT_SECRET;
        const credentialsBytes = Uint8Array.from(atob(credentialsBase64), c => c.charCodeAt(0));
        const credentialsString = new TextDecoder().decode(credentialsBytes);

        await fs.writeFile(path.join(os.tmpdir(), "keyfile.json"), credentialsString);

        const auth = new Auth.GoogleAuth({
            keyFile: path.join(os.tmpdir(), "keyfile.json"),
            scopes: ['https://www.googleapis.com/auth/gmail.send']
        });

        const client = auth.getClient();

        const gmail = google.gmail({ version: 'v1', auth: client });

        const message = [
            'Content-Type: text/html; charset=utf-8',
            'To: ' + authenticationRequest.email,
            'Subject: Sign in link for Dear Emilie',
            '',
            'Here is the sign in link you requested: ' + process.env.SIGN_IN_URL +
                '?id=' + authenticationRequest.rowKey
        ].join('\n');

        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
              raw: Buffer.from(message).toString('base64'),
            }
        });
        return res;
    } catch (err) {
        context.log(err);
        throw err;
    }
}

module.exports = async function (context, req) {
    try {
        context.log('Send e-mail HTTP trigger function processed a request.');

        const allowedEmails = process.env.ALLOWED_EMAILS.split(';');

        const email = req.body && req.body.email;

        if (!email) {
            context.res = {
                status: 400,
                body: 'No e-mail provided'
            };
            return;
        }

        if (allowedEmails.filter(e => e === email).length === 0) {
            context.res = {
                status: 403,
                body: 'E-mail not allowed'
            };
            return;
        }

        const authenticationRequest = await insertAuthenticationRequest(context, email);

        // decouple the polling ID from the authentication request so that we can keep the link sent
        // to log in secret
        const pollingRequest = await insertPollingRequest(context, authenticationRequest.rowKey);

        const sendEmailResult = await sendMail(context, authenticationRequest);
    
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: sendEmailResult
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: '' + err
        };
    }
}