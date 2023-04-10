const { TableServiceClient, AzureNamedKeyCredential, TableClient } = require("@azure/data-tables");

async function getTableClient(context, tableName) {
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
    
        await serviceClient.createTable(tableName, {
            onResponse: (response) => {
                if (response.status === 409) {
                    context.log('Table ' + tableName + ' already exists');
                }
            }
        });
        const tableClient = new TableClient(url, tableName, credential);

        return tableClient;
    } catch (err) {
        context.log(err);
        throw err;
    }
}

module.exports = getTableClient;
