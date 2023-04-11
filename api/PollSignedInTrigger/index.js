const { v4: uuidv4 } = require('uuid');
const getTableClient = require('../shared/getTableClient.js');

async function getAuthenticationRequest(context, id) {
    const tableClient = await getTableClient(context, 'authenticationrequests');

    const entity = await tableClient.getEntity('Prod', id);

    return entity;
}

async function getPollingRequest(context, id) {
    const tableClient = await getTableClient(context, 'pollingrequests');

    const entity = await tableClient.getEntity('Prod', id);

    return entity;
}

async function createSession(context, email) {
    const tableClient = await getTableClient(context, 'sessions');

    let session = {
        partitionKey: 'Prod',
        rowKey: uuidv4(),
        email: email
    };

    tableClient.createEntity(session);
    return session;
}

module.exports = async function (context, req) {
    try {
        context.log('JavaScript HTTP trigger function processed a request.');

        const pollingRequestID = req.query.id;
    
        if (!pollingRequestID) {
            context.res = {
                status: 400,
                body: 'No ID provided'
            };
            return;
        }
        
        const pollingRequest = await getPollingRequest(context, pollingRequestID);
    
        if (!pollingRequest) {
            context.res = {
                status: 404,
                body: 'Polling request not found'
            };
            return;
        }
    
        const authenticationRequest = await getAuthenticationRequest(context, pollingRequest.authenticationRequestID);
    
        if (!authenticationRequest) {
            context.res = {
                status: 404,
                body: 'Authentication request not found'
            };
            return;
        }
    
        if (!authenticationRequest.clickedDate) {
            // okay, but not ready yet
            context.res = {
                status: 200,
                sessionID: null
            };
            return;
        }
    
        const dateDiff = new Date() - new Date(authenticationRequest.timestamp);
    
        if (dateDiff > 24 * 60 * 60 * 1000) {
            context.res = {
                status: 403,
                body: 'sign in link expired'
            };
            return;
        }
    
        const session = await createSession(context, authenticationRequest.email);
    
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: {
                sessionID: session.rowKey
            }
        };
    } catch (e) {
        context.res = {
            status: 500,
            body: '' + e
        }
    }
}