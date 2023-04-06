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
    alert(sendEmailText);
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