const { v4: uuidv4 } = require('uuid');
const { TableServiceClient, AzureNamedKeyCredential, TableClient } = require("@azure/data-tables");

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
                    context.log('Table challenges already exists');
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

        const responseMessage = 'Hello ' + email + ' ' + authenticationRequest.rowKey;
    
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: responseMessage
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: '' + err
        };
    }
}