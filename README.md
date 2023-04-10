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
 + Create a service account key
 + Delegate the e-mail sending rights of one of your GMail accounts to that service account https://developers.google.com/identity/protocols/oauth2/service-account?hl=de#delegatingauthority

(maybe not, maybe we'll just have to store the actual user's credentials in JSON).