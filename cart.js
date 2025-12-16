// cart.js

// Cart Data Structure
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let selectedItems = JSON.parse(localStorage.getItem('selectedItems')) || [];

// DOM Elements
const cartItemsContainer = document.getElementById('cartContent');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const cartCountNav = document.getElementById('cartCountNav');
const cartCount = document.getElementById('cartCount');
const clearCartBtn = document.getElementById('clearCartBtn');
const cartNotification = document.getElementById('cartNotification');
const notificationMessage = document.getElementById('notificationMessage');
const orderSummary = document.getElementById('orderSummary');
const selectedCount = document.getElementById('selectedCount');
const selectedSubtotal = document.getElementById('selectedSubtotal');
const totalAmount = document.getElementById('totalAmount');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
const proceedBtn = document.getElementById('proceedBtn');

// Format currency
function formatCurrency(amount) {
    return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Calculate subtotal
function calculateSubtotal() {
    return selectedItems.reduce((total, itemId) => {
        const item = cart.find(item => item.id === itemId);
        return total + (item?.price || 0);
    }, 0);
}

// Calculate total
function calculateTotal() {
    const subtotal = calculateSubtotal();
    const deliveryFee = 15000;
    const insuranceFee = 20000;
    return subtotal + deliveryFee + insuranceFee;
}

// Update order summary
function updateOrderSummary() {
    const subtotal = calculateSubtotal();
    const total = calculateTotal();
    
    selectedCount.textContent = selectedItems.length;
    selectedSubtotal.textContent = formatCurrency(subtotal);
    totalAmount.textContent = formatCurrency(total);
    
    // Enable/disable proceed button
    proceedBtn.disabled = selectedItems.length === 0;
    
    // Update select all checkbox
    if (cart.length > 0) {
        selectAllCheckbox.checked = selectedItems.length === cart.length;
        selectAllCheckbox.indeterminate = selectedItems.length > 0 && selectedItems.length < cart.length;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
}

// Update cart display
function updateCartDisplay() {
    // Save cart and selected items to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('selectedItems', JSON.stringify(selectedItems));
    
    // Update cart count in navbar
    const cartCount = cart.length;
    cartCountNav.textContent = cartCount;
    
    // Clear existing cart items
    const existingCartItems = cartItemsContainer.querySelector('.cart-items');
    if (existingCartItems) {
        existingCartItems.remove();
    }
    
    if (cart.length === 0) {
        // Show empty cart message
        emptyCartMessage.style.display = 'block';
        orderSummary.style.display = 'none';
    } else {
        // Hide empty cart message
        emptyCartMessage.style.display = 'none';
        orderSummary.style.display = 'block';
        
        // Create cart items container
        const cartItems = document.createElement('div');
        cartItems.className = 'cart-items';
        
        // Add each cart item
        cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.className = `cart-item ${selectedItems.includes(item.id) ? 'selected' : ''}`;
            cartItem.innerHTML = `
                <div class="cart-item-checkbox">
                    <label class="checkbox-container">
                        <input type="checkbox" class="item-checkbox" data-id="${item.id}" ${selectedItems.includes(item.id) ? 'checked' : ''}>
                        <span class="checkmark"></span>
                    </label>
                </div>
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">${formatCurrency(item.price)}/4 Days</p>
                    
                    <div class="cart-item-variants">
                        ${item.color ? `<span class="cart-item-color">Color: ${item.color}</span>` : ''}
                        ${item.size ? `<span class="cart-item-size">Size: ${item.size}</span>` : ''}
                    </div>
                    
                    <div class="cart-item-actions">
                        <div class="quantity-selector">
                            <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                            <input type="text" class="quantity-input" value="${item.quantity || 1}" readonly>
                            <button class="quantity-btn increase" data-id="${item.id}">+</button>
                        </div>
                        <button class="remove-from-cart-btn" data-id="${item.id}">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
        
        // Insert cart items before order summary
        cartItemsContainer.insertBefore(cartItems, orderSummary);
        
        // Add event listeners to new elements
        addEventListeners();
        
        // Update order summary
        updateOrderSummary();
    }
    
    // Update cart count in cart page
    document.getElementById('cartCount').textContent = cart.length;
}

// Add event listeners to cart items
function addEventListeners() {
    // Checkbox selection
    document.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const itemId = this.getAttribute('data-id');
            
            if (this.checked) {
                // Add to selected items if not already selected
                if (!selectedItems.includes(itemId)) {
                    selectedItems.push(itemId);
                }
            } else {
                // Remove from selected items
                const index = selectedItems.indexOf(itemId);
                if (index > -1) {
                    selectedItems.splice(index, 1);
                }
            }
            
            // Update UI
            const cartItem = this.closest('.cart-item');
            if (this.checked) {
                cartItem.classList.add('selected');
            } else {
                cartItem.classList.remove('selected');
            }
            
            updateOrderSummary();
            localStorage.setItem('selectedItems', JSON.stringify(selectedItems));
        });
    });
    
    // Quantity buttons
    document.querySelectorAll('.quantity-btn.decrease').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            const item = cart.find(item => item.id === itemId);
            const quantityInput = this.parentElement.querySelector('.quantity-input');
            
            if (item && item.quantity > 1) {
                item.quantity--;
                quantityInput.value = item.quantity;
                updateOrderSummary();
                showNotification(`Updated quantity for ${item.name}`);
            } else if (item && item.quantity === 1) {
                // Remove item if quantity becomes 0
                removeFromCart(itemId);
            }
        });
    });
    
    document.querySelectorAll('.quantity-btn.increase').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            const item = cart.find(item => item.id === itemId);
            const quantityInput = this.parentElement.querySelector('.quantity-input');
            
            if (item) {
                item.quantity = (item.quantity || 1) + 1;
                quantityInput.value = item.quantity;
                updateOrderSummary();
                showNotification(`Updated quantity for ${item.name}`);
            }
        });
    });
    
    // Remove from cart buttons
    document.querySelectorAll('.remove-from-cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            removeFromCart(itemId);
        });
    });
}

// Remove item from cart
function removeFromCart(itemId) {
    const item = cart.find(item => item.id === itemId);
    
    if (item) {
        // Remove from cart
        const index = cart.findIndex(item => item.id === itemId);
        cart.splice(index, 1);
        
        // Remove from selected items
        const selectedIndex = selectedItems.indexOf(itemId);
        if (selectedIndex > -1) {
            selectedItems.splice(selectedIndex, 1);
        }
        
        updateCartDisplay();
        showNotification(`${item.name} removed from cart!`);
    }
}

// Clear cart
function clearCart() {
    if (cart.length > 0) {
        if (confirm('Are you sure you want to clear your cart?')) {
            cart = [];
            selectedItems = [];
            updateCartDisplay();
            showNotification('Cart cleared successfully!');
        }
    }
}

// Select all items
function selectAllItems(select) {
    if (select) {
        // Select all items
        selectedItems = cart.map(item => item.id);
    } else {
        // Deselect all items
        selectedItems = [];
    }
    
    // Update checkboxes
    document.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.checked = select;
    });
    
    // Update item selection styling
    document.querySelectorAll('.cart-item').forEach(item => {
        if (select) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    
    updateOrderSummary();
    localStorage.setItem('selectedItems', JSON.stringify(selectedItems));
}

// Proceed to checkout
function proceedToCheckout() {
    if (selectedItems.length === 0) {
        showNotification('Please select at least one item to proceed!');
        return;
    }
    
    // Save selected items for checkout
    localStorage.setItem('checkoutItems', JSON.stringify(selectedItems));
    
    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

// Show notification
function showNotification(message) {
    notificationMessage.textContent = message;
    cartNotification.classList.add('show');
    
    setTimeout(() => {
        cartNotification.classList.remove('show');
    }, 3000);
}

// Initialize cart
updateCartDisplay();

// Event Listeners
clearCartBtn.addEventListener('click', clearCart);

selectAllCheckbox.addEventListener('change', function() {
    selectAllItems(this.checked);
});

proceedBtn.addEventListener('click', proceedToCheckout);

// Update wishlist count if needed
function updateWishlistCount() {
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const wishlistCountNav = document.getElementById('wishlistCountNav');
    if (wishlistCountNav) {
        wishlistCountNav.textContent = wishlist.length;
    }
}

// Initialize wishlist count
updateWishlistCount();