// Handle sign in form
if (document.getElementById('signinForm')) {
    document.getElementById('signinForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        
        submitBtn.disabled = true;
        submitText.textContent = 'Signing In...';
        
        const email = document.getElementById('email').value;
        
        try {
            const response = await fetch('/auth/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showMessage('Sign in successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                showMessage(result.error, 'error');
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitText.textContent = 'Sign In';
        }
    });
}

// Handle sign up form
if (document.getElementById('signupForm')) {
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        
        submitBtn.disabled = true;
        submitText.textContent = 'Creating Account...';
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            telegramUsername: document.getElementById('telegramUsername').value,
            phoneNumber: document.getElementById('phoneNumber').value
        };
        
        try {
            const response = await fetch('/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showMessage('Account created successfully! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                showMessage(result.error, 'error');
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitText.textContent = 'Sign Up';
        }
    });
}

function showMessage(text, type) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    let className = 'mt-6 p-4 border ';
    
    if (type === 'success') {
        className += 'border-white text-white bg-black';
    } else {
        className += 'border-gray-400 text-gray-400 bg-black';
    }
    
    msg.className = className;
    msg.classList.remove('hidden');
    
    setTimeout(() => msg.classList.add('hidden'), 5000);
}
