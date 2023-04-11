const waitFor = (milliseconds) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, milliseconds);
    });
};

const pollForAuthenticated = async (pollingRequestID, iterationsRemaining) => {
    console.log('Polling request ' + pollingRequestID + ' iteration ' + iterationsRemaining);
    await waitFor(1000);
    if (iterationsRemaining <= 0) {
        // maybe show an error message?
        return;
    } else {
        await pollForAuthenticated(pollingRequestID, iterationsRemaining - 1);
    }
};

const startLogin = async (email) => {
    const sendEmailResponse = await fetch('/api/SendEmailTrigger', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email
        })
    });
    const sendEmailText = await sendEmailResponse.text();
    if (sendEmailResponse.status !== 200) {
        alert(sendEmailText);
        return;
    }
    const asJSON = JSON.parse(sendEmailText);
    const pollingRequestID = asJSON.pollingRequestID;
    await pollForAuthenticated(pollingRequestID, 120);
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
    const singInText = await signInResponse.text();
    alert(singInText);
};

const itsMeForm = document.querySelector('#itsme');
if (itsMeForm) {
    itsMeForm.addEventListener('submit', ev => {
        itsMe();
        ev.preventDefault();
    });
}

