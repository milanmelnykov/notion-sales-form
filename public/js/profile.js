let clientData = null;

async function loadProfile() {
    try {
        // Use cached client data
        const data = await getCachedClientData();
        clientData = data.client;
        
        // Populate form fields
        document.getElementById('name').value = clientData.name || '';
        document.getElementById('email').value = clientData.email || '';
        document.getElementById('telegramUsername').value = (clientData.telegramUsername || '').replace('@', '');
        document.getElementById('phoneNumber').value = clientData.phoneNumber || '';
        
        document.getElementById('loadingProfile').style.display = 'none';
        document.getElementById('profileForm').classList.remove('hidden');
        
    } catch (error) {
        if (error.message === 'Not authenticated') {
            window.location.href = '/signin';
        } else {
            showMessage('Error loading profile: ' + error.message, 'error');
        }
    }
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    
    submitBtn.disabled = true;
    submitText.textContent = 'Updating...';
    
    const formData = {
        name: document.getElementById('name').value,
        telegramUsername: document.getElementById('telegramUsername').value,
        phoneNumber: document.getElementById('phoneNumber').value
    };
    
    try {
        const response = await fetch('/auth/update-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Clear cached client data to refresh
            appCache.clear('clientData');
            showMessage('Profile updated successfully!', 'success');
            
            // Update local client data
            clientData = { ...clientData, ...formData };
        } else {
            showMessage(result.error, 'error');
        }
    } catch (error) {
        showMessage('Error updating profile: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitText.textContent = 'Update Profile';
    }
});

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

// Load profile on page load
loadProfile();
