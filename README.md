# Dear Emilie - E-mail authentication
Using a link sent by e-mail to authenticate. Playground in Azure Static Web apps, using the gmail api.

Goals:
 - Rate limiting e-mail sending
 - Polling from the window that started the authentication process (note to self: can we do something cryptographically interesting here to prove that we are allowed to log in)
 - Expiring links

## Setting up the mail sending
Since we'll be sending mails I thought of using the gmail API. This involved the following steps:

 + In the Google Cloud Console, create a new project
 + Enable the Gmail API
 + Set up OAuth (as a native application), see code in get-token
 + Run the get-token code with the OAuth credentials downloaded from the project. Save the content of token.json in the environment variable GMAIL_TOKEN

This points to a very important caveat that I didn't know when starting: you can't send mails from a service account, you either have to delegate the rights to a service account to send mails on behalf of a member of your organization, or you can do like I did and use your client credentials by obtaining a token using the interactive flow.

