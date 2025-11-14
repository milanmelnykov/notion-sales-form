// Simple client-side cache with expiration
class Cache {
    constructor() {
        this.data = {};
        this.expiration = {};
    }

    set(key, value, ttlMinutes = 30) {
        this.data[key] = value;
        this.expiration[key] = Date.now() + (ttlMinutes * 60 * 1000);
        
        // Store in sessionStorage for persistence across page loads
        try {
            sessionStorage.setItem(`cache_${key}`, JSON.stringify({
                value,
                expires: this.expiration[key]
            }));
        } catch (e) {
            // Ignore storage errors
        }
    }

    get(key) {
        // Check memory first
        if (this.data[key] && Date.now() < this.expiration[key]) {
            return this.data[key];
        }

        // Check sessionStorage
        try {
            const stored = sessionStorage.getItem(`cache_${key}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Date.now() < parsed.expires) {
                    this.data[key] = parsed.value;
                    this.expiration[key] = parsed.expires;
                    return parsed.value;
                } else {
                    sessionStorage.removeItem(`cache_${key}`);
                }
            }
        } catch (e) {
            // Ignore storage errors
        }

        return null;
    }

    clear(key) {
        delete this.data[key];
        delete this.expiration[key];
        try {
            sessionStorage.removeItem(`cache_${key}`);
        } catch (e) {
            // Ignore storage errors
        }
    }

    clearAll() {
        this.data = {};
        this.expiration = {};
        try {
            Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith('cache_')) {
                    sessionStorage.removeItem(key);
                }
            });
        } catch (e) {
            // Ignore storage errors
        }
    }
}

// Global cache instance
window.appCache = new Cache();

// Cache API functions
window.getCachedClientData = async function(forceRefresh = false) {
    // Don't cache client data with orders since image URLs expire
    // Always fetch fresh to get current image URLs
    const response = await fetch('/auth/client-data', {
        credentials: 'same-origin'
    });
    if (!response.ok) {
        throw new Error('Not authenticated');
    }
    const clientData = await response.json();
    
    return clientData;
};

window.getCachedProducts = async function(forceRefresh = false) {
    if (forceRefresh) {
        appCache.clear('products');
    }
    
    let products = appCache.get('products');
    
    if (!products) {
        const response = await fetch('/api/products', {
            credentials: 'same-origin'
        });
        if (!response.ok) {
            throw new Error('Failed to load products');
        }
        products = await response.json();
        appCache.set('products', products, 30); // Cache for 30 minutes instead of 1 hour
    }
    
    return products;
};

// Add refresh function
window.refreshProducts = async function() {
    try {
        const products = await getCachedProducts(true); // Force refresh
        return products;
    } catch (error) {
        console.error('Failed to refresh products:', error);
        throw error;
    }
};

// Clear cache on sign out
window.clearAuthCache = function() {
    // Clear any remaining cached data
    appCache.clearAll();
};
