module.exports = async function (context, req) {
    try {
        context.log('Send e-mail HTTP trigger function processed a request.');

        const email = req.body && req.body.email;
        const responseMessage = 'Hello ' + email;
    
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