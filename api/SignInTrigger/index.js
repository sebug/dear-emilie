module.exports = async function (context, req) {
    context.log('Sign in HTTP trigger function processed a request.');

    const id = req.query.id;
    const responseMessage = 'Signing in with authentication request id ' + id;

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}