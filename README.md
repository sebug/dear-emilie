# Dear Emilie - E-mail authentication
Using a link sent by e-mail to authenticate. Playground in Azure Static Web apps, using the gmail api.

Goals:
 - Rate limiting e-mail sending
 - Polling from the window that started the authentication process (note to self: can we do something cryptographically interesting here to prove that we are allowed to log in)
 - Expiring links
