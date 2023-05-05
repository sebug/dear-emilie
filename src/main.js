const waitFor = (milliseconds) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, milliseconds);
    });
};

const pollForAuthenticated = async (pollingRequestID, iterationsRemaining) => {
    console.log('Polling request ' + pollingRequestID + ' iteration ' + iterationsRemaining);
    const pollResponse = await fetch('/api/PollSignedInTrigger?id=' + pollingRequestID);
    if (pollResponse.status !== 200) {
        const errorText = await pollResponse.text();
        alert(errorText);
        return;
    }
    const pollObject = await pollResponse.json();
    if (pollObject.sessionID) {
        location.href = '/logged_in.html?id=' + pollObject.sessionID;
        return;
    }
    await waitFor(1000);
    if (iterationsRemaining <= 0) {
        // maybe show an error message?
        return;
    } else {
        await pollForAuthenticated(pollingRequestID, iterationsRemaining - 1);
    }
};

const startLogin = async (email) => {
    let publicKeyInformation = null;
    let textWithSignature = null;

    try {
        window.keyPair = await crypto.subtle.generateKey({
            name: 'ECDSA',
            namedCurve: 'P-256'
        }, true, ['sign', 'verify']);
        console.log(window.keyPair);
        publicKeyInformation = await crypto.subtle.exportKey('jwk', window.keyPair.publicKey);
        let textEncoder = new TextEncoder();
        textWithSignature = {};
        textWithSignature.text = 'Hello signature: ' + crypto.randomUUID();
        let signature = await crypto.subtle.sign({
            name: 'ECDSA',
            hash: {
                name: 'SHA-256'
            }
        }, window.keyPair.privateKey,
        textEncoder.encode(textWithSignature.text));
        textWithSignature.signature = btoa(String.fromCharCode.apply(null, new Uint8Array(signature)));

        console.log(publicKeyInformation);
        console.log(textWithSignature);
    } catch (e) {
        console.log('Creating public key failed - we will have to do without polling');
    }

    const sendEmailResponse = await fetch('/api/SendEmailTrigger', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            publicKeyInformation: publicKeyInformation,
            textWithSignature: textWithSignature
        })
    });
    const sendEmailText = await sendEmailResponse.text();
    if (sendEmailResponse.status !== 200) {
        alert(sendEmailText);
        return;
    }
    const asJSON = JSON.parse(sendEmailText);
    const pollingRequestID = asJSON.pollingRequestID;
    if (pollingRequestID) {
        // may not get one if we didn't provide a public key for signature verification
        await pollForAuthenticated(pollingRequestID, 120);
    }
}

const loginForm = document.querySelector('#login');
if (loginForm) {
    loginForm.addEventListener('submit', ev => {
        const emailEl = loginForm.querySelector('#email');
        const email = emailEl.value;
        startLogin(email);
        ev.preventDefault();
    });
}

const itsMe = async () => {
    const params = new URLSearchParams(location.search);
    if (!params.get('id')) {
        return;
    }
    const signInResponse = await fetch('/api/SignInTrigger?id=' + params.get('id'));
    if (signInResponse.status !== 200) {
        const errorText = await signInResponse.text();
        alert(errorText);
        return;
    }
    const signInContent = await signInResponse.json();
    location.href = '/logged_in.html?id=' + signInContent.sessionID;
};

const itsMeForm = document.querySelector('#itsme');
if (itsMeForm) {
    itsMeForm.addEventListener('submit', ev => {
        itsMe();
        ev.preventDefault();
    });
}

