const getTableClient = require('../shared/getTableClient.js');

async function getAuthenticationRequest(context, id) {
    const tableClient = await getTableClient(context, 'authenticationrequests');

    const entity = await tableClient.getEntity('Prod', id);

    return entity;
}


async function updateAuthenticationRequest(context, authenticationRequest) {
    const tableClient = await getTableClient(context, 'authenticationrequests');

    await tableClient.updateEntity(authenticationRequest);

    return authenticationRequest;
}

module.exports = async function (context, req) {
    context.log('Sign in HTTP trigger function processed a request.');

    const id = req.query.id;

    const authenticationRequest = await getAuthenticationRequest();

    if (!authenticationRequest) {
        context.res = {
            status: 403,
            body: 'Not Authorized'
        };
        return;
    }

    authenticationRequest.clickedDate = new Date();

    authenticationRequest = await updateAuthenticationRequest(context, authenticationRequest);

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: authenticationRequest
    };
}