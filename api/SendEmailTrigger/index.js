const { v4: uuidv4 } = require('uuid');
const { TableServiceClient, AzureNamedKeyCredential, TableClient } = require("@azure/data-tables");
const { Auth, google } = require('googleapis');
const { authenticate } = require('@google-cloud/local-auth');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const getTableClient = require('../shared/getTableClient.js');

async function insertAuthenticationRequest(context, email) {
    try {
        const tableClient = await getTableClient(context, 'authenticationrequests');

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
        const tableClient = await getTableClient(context, 'pollingrequests');
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

async function getTokenContent(context) {
    const tableClient = await getTableClient(context, 'tokens');

    const entity = await tableClient.getEntity('Prod', 'email_sender');

    return {
        type: 'authorized_user',
        client_id: entity.client_id,
        client_secret: entity.client_secret,
        refresh_token: entity.refresh_token
    };
}

async function sendMail(context, authenticationRequest) {
    try {
        const token = await getTokenContent(context);

        const auth = google.auth.fromJSON(token);

        const tokenInfo = await auth.getTokenInfo(JSON.stringify(token));

        context.log('Token info');
        context.log(tokenInfo);

        const gmail = google.gmail({ version: 'v1', auth: auth });

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
            resource: {
              raw: Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
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
            body: {
                pollingRequestID: pollingRequest.rowKey
            }
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: err
        };
    }
}