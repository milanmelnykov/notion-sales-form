let productCount = 0;
let products = [];

async function loadProducts() {
    try {
        // Use cached products
        products = await getCachedProducts();
        document.getElementById('loadingProducts').style.display = 'none';
        document.getElementById('orderForm').classList.remove('hidden');
        addProduct();
    } catch (error) {
        showMessage('Error loading products: ' + error.message, 'error');
    }
}

function addProduct() {
    const container = document.getElementById('productsContainer');
    const currentItems = container.querySelectorAll('[id^="product-"]').length;
    const newItemNumber = currentItems + 1;
    
    productCount++;
    const productDiv = document.createElement('div');
    productDiv.className = 'border border-gray-700 p-4';
    productDiv.id = `product-${productCount}`;
    
    productDiv.innerHTML = `
        <div class="text-xs text-gray-500 mb-3">Item ${newItemNumber}</div>
        <div class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="select-wrapper">
                    <select name="product" required onchange="updateProductOptions(${productCount})"
                            class="w-full px-3 py-3 bg-black border border-gray-600 text-white focus:border-white focus:outline-none transition-colors">
                        <option value="">Select</option>
                        ${products.map(p => `<option value="${p.id}" data-colors='${JSON.stringify(p.colors)}' data-sizes='${JSON.stringify(p.sizes)}' data-price="${p.price || 0}">${p.name}</option>`).join('')}
                    </select>
                </div>
                <input type="number" name="quantity" placeholder="Qty" min="1" value="1" required onchange="updateItemPrice(${productCount})"
                       class="px-3 py-3 bg-black border border-gray-600 text-white focus:border-white focus:outline-none transition-colors">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="select-wrapper">
                    <select name="color" required disabled
                            class="w-full px-3 py-3 bg-black border border-gray-600 text-white focus:border-white focus:outline-none transition-colors disabled:opacity-50">
                        <option value="">Color</option>
                    </select>
                </div>
                <div class="select-wrapper">
                    <select name="size" required disabled
                            class="w-full px-3 py-3 bg-black border border-gray-600 text-white focus:border-white focus:outline-none transition-colors disabled:opacity-50">
                        <option value="">Size</option>
                    </select>
                </div>
            </div>
            <div class="flex justify-between items-center p-3 bg-gray-900 border border-gray-600">
                <span class="text-gray-400 text-sm">Item Total:</span>
                <span class="text-white font-bold" id="itemPrice-${productCount}">₴0.00</span>
            </div>
            <button type="button" onclick="removeProduct(${productCount})"
                    class="w-full bg-black border border-gray-600 text-gray-400 px-3 py-3 hover:border-gray-400 hover:text-white transition-colors">
                Remove
            </button>
        </div>
    `;
    
    container.appendChild(productDiv);
}

function updateProductOptions(productId) {
    const productDiv = document.getElementById(`product-${productId}`);
    const productSelect = productDiv.querySelector('[name="product"]');
    const colorSelect = productDiv.querySelector('[name="color"]');
    const sizeSelect = productDiv.querySelector('[name="size"]');
    
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    
    if (selectedOption.value) {
        const colors = JSON.parse(selectedOption.dataset.colors || '[]');
        const sizes = JSON.parse(selectedOption.dataset.sizes || '[]');
        
        colorSelect.innerHTML = '<option value="">Color</option>' + 
            colors.map(c => `<option value="${c}">${c}</option>`).join('');
        colorSelect.disabled = false;
        colorSelect.classList.remove('opacity-50');
        
        sizeSelect.innerHTML = '<option value="">Size</option>' + 
            sizes.map(s => `<option value="${s}">${s}</option>`).join('');
        sizeSelect.disabled = false;
        sizeSelect.classList.remove('opacity-50');
    } else {
        colorSelect.innerHTML = '<option value="">Color</option>';
        colorSelect.disabled = true;
        colorSelect.classList.add('opacity-50');
        sizeSelect.innerHTML = '<option value="">Size</option>';
        sizeSelect.disabled = true;
        sizeSelect.classList.add('opacity-50');
    }
    
    updateItemPrice(productId);
}

function updateItemPrice(productId) {
    const productDiv = document.getElementById(`product-${productId}`);
    const productSelect = productDiv.querySelector('[name="product"]');
    const quantityInput = productDiv.querySelector('[name="quantity"]');
    const itemPriceElement = document.getElementById(`itemPrice-${productId}`);
    
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const price = parseFloat(selectedOption.dataset.price || 0);
    const quantity = parseInt(quantityInput.value || 0);
    const itemTotal = price * quantity;
    
    itemPriceElement.textContent = `₴${itemTotal.toFixed(2)}`;
    updateOrderTotal();
}

function updateOrderTotal() {
    let total = 0;
    document.querySelectorAll('[id^="itemPrice-"]').forEach(priceElement => {
        const price = parseFloat(priceElement.textContent.replace('₴', ''));
        total += price;
    });
    document.getElementById('orderTotal').textContent = `₴${total.toFixed(2)}`;
}

function removeProduct(id) {
    document.getElementById(`product-${id}`).remove();
    updateOrderTotal();
}

document.getElementById('orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    
    // Show loading state
    submitBtn.disabled = true;
    submitText.innerHTML = '<span class="loading-dots">Processing order</span>';
    showMessage('Order in progress, please wait a few seconds...', 'loading');
    
    const notes = document.getElementById('notes').value;
    const photoFiles = document.getElementById('photo').files;
    
    const productItems = [];
    document.querySelectorAll('[id^="product-"]').forEach(item => {
        const productSelect = item.querySelector('[name="product"]');
        if (productSelect.value) {
            productItems.push({
                productId: productSelect.value,
                productName: productSelect.options[productSelect.selectedIndex].text,
                color: item.querySelector('[name="color"]').value,
                size: item.querySelector('[name="size"]').value,
                quantity: parseInt(item.querySelector('[name="quantity"]').value)
            });
        }
    });

    if (productItems.length === 0) {
        submitBtn.disabled = false;
        submitText.textContent = 'Submit Order';
        showMessage('Please add at least one item', 'error');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('data', JSON.stringify({ 
            notes,
            items: productItems 
        }));
        
        for (let i = 0; i < photoFiles.length; i++) {
            formData.append('photos', photoFiles[i]);
        }

        const response = await fetch('/api/create-order', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (response.ok) {
            showMessage('Order submitted successfully! Redirecting to dashboard...', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        } else {
            showMessage('Error: ' + result.error, 'error');
        }
    } catch (error) {
        showMessage('Error submitting order: ' + error.message, 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitText.textContent = 'Submit Order';
    }
});

function showMessage(text, type) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    let className = 'mt-6 p-4 border ';
    
    if (type === 'success') {
        className += 'border-white text-white bg-black';
    } else if (type === 'loading') {
        className += 'border-gray-400 text-gray-300 bg-black';
    } else {
        className += 'border-gray-400 text-gray-400 bg-black';
    }
    
    msg.className = className;
    msg.classList.remove('hidden');
    
    if (type !== 'loading') {
        setTimeout(() => msg.classList.add('hidden'), 5000);
    }
}

loadProducts();
