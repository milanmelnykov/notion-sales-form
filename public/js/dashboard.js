let clientData = null;

async function loadDashboard() {
    try {
        // Use cached client data
        const data = await getCachedClientData();
        clientData = data;
        
        // Update client name immediately (no loading state needed)
        document.getElementById('clientName').textContent = data.client.name;
        
        // Load orders
        displayOrders(data.orders);
        
    } catch (error) {
        if (error.message === 'Not authenticated') {
            window.location.href = '/signin';
        } else {
            showMessage('Error loading dashboard: ' + error.message, 'error');
        }
    }
}

function displayOrders(orders) {
    const container = document.getElementById('ordersContainer');
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-12">
                <p class="text-lg mb-2">No orders yet</p>
                <p class="text-sm">Your order history will appear here</p>
                <a href="/order" class="inline-block mt-4 text-white hover:text-gray-300 font-bold border border-gray-600 px-4 py-2 hover:border-white transition-colors">Create your first order</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="border border-gray-700 hover:border-gray-600 transition-colors">
            <!-- Order Header -->
            <div class="p-6 border-b border-gray-800">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-calligraphy font-bold text-white">${order.name}</h3>
                        ${order.orderId ? `<p class="text-sm text-gray-400 mt-1">Order #${order.orderId}</p>` : ''}
                    </div>
                    <div class="text-right">
                        <span class="px-3 py-1 text-xs font-bold rounded ${getStatusColor(order.status)}">
                            ${order.status}
                        </span>
                        <p class="text-sm text-gray-400 mt-1">${formatDate(order.added)}</p>
                    </div>
                </div>
                
                <!-- Order Summary -->
                <div class="grid grid-cols-2 gap-6 text-center">
                    <div class="border-r border-gray-800">
                        <div class="text-2xl font-bold text-white">₴${(order.totalPrice || 0).toFixed(2)}</div>
                        <div class="text-xs text-gray-400 uppercase tracking-wide">Total</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-white">${(order.items || []).length}</div>
                        <div class="text-xs text-gray-400 uppercase tracking-wide">Products</div>
                    </div>
                </div>
            </div>
            
            <!-- Order Items -->
            ${(order.designs && order.designs.length > 0) ? `
                <div class="p-6 border-t border-gray-800">
                    <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Designs</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        ${order.designs.map(design => `
                            <div class="border border-gray-700 rounded overflow-hidden hover:border-gray-600 transition-colors">
                                <img src="${design.file?.url || design.external?.url}" 
                                     alt="${design.name}" 
                                     class="w-full h-24 object-cover cursor-pointer"
                                     onclick="openImageModal('${design.file?.url || design.external?.url}', '${design.name}')"
                                     onerror="this.parentElement.innerHTML='<div class=\\'h-24 flex items-center justify-center text-gray-500 text-xs\\'>Image unavailable</div>'">
                                <div class="p-2">
                                    <p class="text-xs text-gray-400 truncate">${design.name}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${(order.items && order.items.length > 0) ? `
                <div class="p-6">
                    <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Order Items</h4>
                    <div class="space-y-2">
                        ${order.items.map(item => `
                            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-800 last:border-b-0 gap-2">
                                <div class="flex-1 min-w-0">
                                    <span class="text-white text-sm block leading-tight" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${item.name || 'Unknown Item'}</span>
                                </div>
                                <div class="text-right text-sm flex-shrink-0">
                                    <span class="text-gray-400">${item.quantity || 0}x ₴${(item.priceForOne || 0).toFixed(2)} = </span>
                                    <span class="text-white font-bold">₴${(item.totalPrice || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${order.notes ? `
                <div class="p-6 pt-0">
                    <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Notes</h4>
                    <p class="text-gray-300 text-sm">${order.notes}</p>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function getStatusColor(status) {
    switch (status) {
        case 'Pending': return 'bg-pink-600 text-white';
        case 'Negotiation': return 'bg-purple-600 text-white';
        case 'In progress': return 'bg-blue-600 text-white';
        case 'Canceled': return 'bg-gray-600 text-white';
        case 'Closed': return 'bg-green-600 text-white';
        default: return 'bg-gray-600 text-white';
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

async function signOut() {
    try {
        const response = await fetch('/auth/signout', { 
            method: 'POST',
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            clearAuthCache(); // Clear cached data
            window.location.href = '/signin';
        } else {
            showMessage('Error signing out', 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

function openImageModal(imageUrl, imageName) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.onclick = () => modal.remove();
    
    // Create modal content
    modal.innerHTML = `
        <div class="max-w-4xl max-h-full bg-black border border-gray-600 rounded overflow-hidden" onclick="event.stopPropagation()">
            <div class="p-4 border-b border-gray-600 flex justify-between items-center">
                <h3 class="text-white font-bold">${imageName}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-xl">&times;</button>
            </div>
            <div class="p-4">
                <img src="${imageUrl}" alt="${imageName}" class="max-w-full max-h-96 mx-auto">
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
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

// Load dashboard on page load
loadDashboard();
