const { v4: uuidv4 } = require('uuid');
const getTableClient = require('../shared/getTableClient.js');

async function getAuthenticationRequest(context, id) {
    const tableClient = await getTableClient(context, 'authenticationrequests');

    const entity = await tableClient.getEntity('Prod', id);

    return entity;
}


async function updateAuthenticationRequest(context, authenticationRequest) {
    const tableClient = await getTableClient(context, 'authenticationrequests');

    await tableClient.updateEntity(authenticationRequest, 'Merge');

    return authenticationRequest;
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
        context.log('Sign in HTTP trigger function processed a request.');

        const id = req.query.id;
    
        let authenticationRequest = await getAuthenticationRequest(context, id);
    
        if (!authenticationRequest) {
            context.res = {
                status: 403,
                body: 'Not Authorized'
            };
            return;
        }

        const session = await createSession(context, authenticationRequest.email);
    
        authenticationRequest.clickedDate = new Date();

        authenticationRequest.sessionID = session.rowKey;
    
        authenticationRequest = await updateAuthenticationRequest(context, authenticationRequest);
    
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
        };
    }
}