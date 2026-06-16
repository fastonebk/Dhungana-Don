// --- CHANDESHWARI ARTS WEBSITE CONTROLLER ---

// Constants & Settings
const CONTACT_PHONE = '9779855024325'; // Rebranded WhatsApp number
const CSV_SAMPLE_URL = 'students-sample.csv';

// Global Application State
let cart = JSON.parse(localStorage.getItem('chandeshwari_cart')) || [];
let activeCategory = 'all';
let searchQuery = '';
let selectedProduct = null;
let selectedVariant = null;
let currentDetailImageIndex = 0;
let studentBatch = [];
let studentPhotoBase64 = null;
let staffPhotoBase64 = null;

// Mock Data for Tracking (pre-populated to make search feel alive)
const DEFAULT_TRACKING_DATA = {
  "9855024325": {
    orders: [
      {
        id: "ORD-9481-22",
        date: "2026-05-28",
        items: "Round Neck Sublimation Tshirt (Qty 2), Metal Badges (Qty 50)",
        total: 12500,
        status: "completed"
      }
    ],
    applications: [
      {
        id: "APP-STU-3829",
        name: "Sujal Shrestha",
        type: "Student",
        schoolName: "Simara Secondary School",
        status: "completed",
        photo: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=100&q=80"
      }
    ]
  },
  "9845020025": {
    orders: [
      {
        id: "ORD-2039-44",
        date: "2026-06-01",
        items: "Baby Birth Photo Frame (Size: A4 - Qty 1)",
        total: 1500,
        status: "pending"
      }
    ],
    applications: [
      {
        id: "APP-STF-5820",
        name: "Aayush Nepali",
        type: "Staff",
        designation: "Assistant Teacher",
        status: "pending",
        photo: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=100&q=80"
      }
    ]
  }
};

// Initialize Tracking database in LocalStorage if not present
if (!localStorage.getItem('chandeshwari_tracking')) {
  localStorage.setItem('chandeshwari_tracking', JSON.stringify(DEFAULT_TRACKING_DATA));
}

// Helper: Get Tracking DB
function getTrackingDb() {
  return JSON.parse(localStorage.getItem('chandeshwari_tracking')) || {};
}

// Helper: Save to Tracking DB
function saveToTrackingDb(db) {
  localStorage.setItem('chandeshwari_tracking', JSON.stringify(db));
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initRouter();
  initNavbarScroll();
  renderProducts();
  updateCartCount();
  setupEventListeners();
  initHeroCarousel();
});

// --- THEME MANAGEMENT ---
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
}

// Toggle light-mode class
function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// --- SINGLE PAGE APP ROUTER ---
function initRouter() {
  const handleRoute = () => {
    const hash = window.location.hash || '#home';
    const sectionId = hash.substring(1) + '-sec';
    
    // Hide all sections, show active section
    const sections = document.querySelectorAll('main section');
    let sectionFound = false;
    
    sections.forEach(sec => {
      if (sec.id === sectionId) {
        sec.classList.add('active');
        sectionFound = true;
      } else {
        sec.classList.remove('active');
      }
    });

    // Fallback if hash doesn't match
    if (!sectionFound && sections.length > 0) {
      sections[0].classList.add('active');
    }

    // Update active state in nav menu links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const linkHash = link.getAttribute('href');
      if (linkHash === hash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Trigger unbeatable circle animation if navigating to home
    const isHome = hash === '#home' || hash === '';
    const unbeatableWrap = document.querySelector('.unbeatable-wrap');
    if (unbeatableWrap) {
      if (isHome) {
        unbeatableWrap.classList.remove('animate');
        void unbeatableWrap.offsetWidth; // Force reflow
        unbeatableWrap.classList.add('animate');
      } else {
        unbeatableWrap.classList.remove('animate');
      }
    }

    // Scroll to top of window
    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeMobileMenu();
  };

  window.addEventListener('hashchange', handleRoute);
  handleRoute(); // Run once on startup
}

// --- NAVBAR EFFECTS ---
function initNavbarScroll() {
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

function toggleMobileMenu() {
  const navMenu = document.querySelector('.nav-menu');
  navMenu.classList.toggle('active');
}

function closeMobileMenu() {
  const navMenu = document.querySelector('.nav-menu');
  if (navMenu) {
    navMenu.classList.remove('active');
  }
}

// --- PRODUCT CATALOG RENDERING & FILTERING ---
function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  grid.innerHTML = '';
  
  // Access items from global products-data.js variable
  if (typeof PRODUCTS_DATA === 'undefined' || !PRODUCTS_DATA.products) {
    grid.innerHTML = '<div class="no-results">Error: Product catalog not found.</div>';
    return;
  }

  const products = PRODUCTS_DATA.products;
  
  // Filter products by category & search query
  const filtered = products.filter(p => {
    // Exclude hidden products
    if (p.isHidden) return false;
    
    // Category match
    const categoryMatch = activeCategory === 'all' || p.category.toLowerCase() === activeCategory.toLowerCase();
    
    // Search query match
    const searchLower = searchQuery.toLowerCase();
    const searchMatch = !searchQuery || 
                        p.name.toLowerCase().includes(searchLower) ||
                        p.shortDesc.toLowerCase().includes(searchLower) ||
                        p.category.toLowerCase().includes(searchLower);
                        
    return categoryMatch && searchMatch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="no-results">No products found matching your search.</div>';
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Get product display image
    const mainImg = (p.images && p.images.length > 0) ? p.images[0] : 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=300&q=80';
    
    // Get starting price
    let displayPrice = '';
    if (p.variants && p.variants.length > 0) {
      // Find minimum price among variants
      const minPrice = Math.min(...p.variants.map(v => v.price));
      displayPrice = `<span>Starts from</span> NPR ${minPrice}`;
    } else {
      displayPrice = `NPR ${p.price || 'Contact Us'}`;
    }

    // Render Badge if any
    const badgeMarkup = p.badges && p.badges.length > 0 ? `<div class="product-card-badge">${p.badges[0]}</div>` : '';

    card.innerHTML = `
      <div class="product-image-box" onclick="openProductDetail('${p._id}')" style="cursor: pointer;">
        ${badgeMarkup}
        <img src="${mainImg}" class="product-img" alt="${p.name}" loading="lazy">
      </div>
      <div class="product-card-info">
        <div class="product-card-category">${p.category}</div>
        <h3 class="product-card-name" onclick="openProductDetail('${p._id}')" style="cursor: pointer;">${p.name}</h3>
        <p class="product-card-desc">${p.shortDesc || ''}</p>
        <div class="product-card-footer">
          <div class="product-card-price">${displayPrice}</div>
          <button class="product-card-btn" onclick="openProductDetail('${p._id}')" title="View Options">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function selectCategory(category, buttonElement) {
  activeCategory = category;
  
  // Highlight active pill
  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(p => p.classList.remove('active'));
  buttonElement.classList.add('active');
  
  renderProducts();
}

function handleSearch(event) {
  searchQuery = event.target.value;
  renderProducts();
}

// --- PRODUCT DETAIL MODAL ---
function openProductDetail(productId) {
  if (typeof PRODUCTS_DATA === 'undefined') return;
  const product = PRODUCTS_DATA.products.find(p => p._id === productId);
  if (!product) return;

  selectedProduct = product;
  currentDetailImageIndex = 0;
  selectedVariant = (product.variants && product.variants.length > 0) ? product.variants[0] : null;

  // Set details inside modal elements
  document.getElementById('detail-category').innerText = product.category;
  document.getElementById('detail-name').innerText = product.name;
  document.getElementById('detail-desc').innerText = product.longDesc || product.shortDesc || '';
  document.getElementById('detail-qty-input').value = 1;

  // Image Section
  updateDetailImages();

  // Price Section
  updateDetailPrice();

  // Options/Variants Section
  const variantsWrapper = document.getElementById('detail-variants-wrapper');
  if (product.variants && product.variants.length > 0) {
    variantsWrapper.style.display = 'block';
    const variantsGrid = document.getElementById('detail-variants-grid');
    variantsGrid.innerHTML = '';
    
    product.variants.forEach((v, index) => {
      const btn = document.createElement('button');
      btn.className = `variant-btn ${index === 0 ? 'active' : ''}`;
      btn.innerText = `${v.label} (NPR ${v.price})`;
      btn.onclick = (e) => selectVariant(v, e.target);
      variantsGrid.appendChild(btn);
    });
  } else {
    variantsWrapper.style.display = 'none';
  }

  // Open Modal
  document.getElementById('product-detail-modal').classList.add('active');
}

function closeProductDetail() {
  document.getElementById('product-detail-modal').classList.remove('active');
  selectedProduct = null;
  selectedVariant = null;
}

function updateDetailImages() {
  if (!selectedProduct) return;
  const mainImg = document.getElementById('detail-main-img');
  const thumbsBox = document.getElementById('detail-thumbs-box');
  
  const images = (selectedProduct.images && selectedProduct.images.length > 0) 
                 ? selectedProduct.images 
                 : ['https://images.unsplash.com/photo-1488161628813-04466f872be2?w=300&q=80'];

  mainImg.src = images[currentDetailImageIndex];
  mainImg.alt = selectedProduct.name;

  // Render Thumbnails
  thumbsBox.innerHTML = '';
  if (images.length > 1) {
    images.forEach((img, idx) => {
      const thumb = document.createElement('img');
      thumb.src = img;
      thumb.className = `detail-thumb ${idx === currentDetailImageIndex ? 'active' : ''}`;
      thumb.onclick = () => {
        currentDetailImageIndex = idx;
        updateDetailImages();
      };
      thumbsBox.appendChild(thumb);
    });
  }
}

function updateDetailPrice() {
  if (!selectedProduct) return;
  const priceEl = document.getElementById('detail-price');
  
  if (selectedVariant) {
    priceEl.innerText = `NPR ${selectedVariant.price}`;
  } else {
    priceEl.innerText = selectedProduct.price ? `NPR ${selectedProduct.price}` : 'Contact for Price';
  }
}

function selectVariant(variant, buttonElement) {
  selectedVariant = variant;
  
  // Highlight active button
  const btns = document.querySelectorAll('.variant-btn');
  btns.forEach(b => b.classList.remove('active'));
  buttonElement.classList.add('active');
  
  updateDetailPrice();
}

function adjustDetailQty(amount) {
  const input = document.getElementById('detail-qty-input');
  let currentVal = parseInt(input.value) || 1;
  currentVal += amount;
  if (currentVal < 1) currentVal = 1;
  input.value = currentVal;
}

// --- CART STATE MANAGEMENT ---
function openCart() {
  renderCartItems();
  document.getElementById('cart-drawer').classList.add('active');
  document.getElementById('drawer-overlay').classList.add('active');
}

function closeCart() {
  document.getElementById('cart-drawer').classList.remove('active');
  document.getElementById('drawer-overlay').classList.remove('active');
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const elements = document.querySelectorAll('.cart-count');
  elements.forEach(el => {
    el.innerText = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function addToCart() {
  if (!selectedProduct) return;
  
  const qtyInput = document.getElementById('detail-qty-input');
  const quantity = parseInt(qtyInput.value) || 1;
  
  const price = selectedVariant ? selectedVariant.price : (selectedProduct.price || 0);
  const variantLabel = selectedVariant ? selectedVariant.label : '';
  const mainImage = (selectedProduct.images && selectedProduct.images.length > 0) ? selectedProduct.images[0] : '';
  
  // Unique ID for item in cart is combining productId and variant
  const cartItemId = selectedVariant ? `${selectedProduct._id}-${selectedVariant.label}` : selectedProduct._id;

  // Check if item already exists in cart
  const existingIdx = cart.findIndex(item => item.cartItemId === cartItemId);
  if (existingIdx > -1) {
    cart[existingIdx].quantity += quantity;
  } else {
    cart.push({
      cartItemId: cartItemId,
      productId: selectedProduct._id,
      name: selectedProduct.name,
      image: mainImage,
      variantLabel: variantLabel,
      price: price,
      quantity: quantity
    });
  }

  // Save and Update
  localStorage.setItem('chandeshwari_cart', JSON.stringify(cart));
  updateCartCount();
  closeProductDetail();
  
  showToast(`Added ${quantity} x ${selectedProduct.name} to cart.`, 'success');
  
  // Auto open cart drawer
  setTimeout(openCart, 300);
}

function adjustCartItemQty(cartItemId, amount) {
  const itemIdx = cart.findIndex(item => item.cartItemId === cartItemId);
  if (itemIdx === -1) return;

  cart[itemIdx].quantity += amount;
  
  if (cart[itemIdx].quantity <= 0) {
    cart.splice(itemIdx, 1);
  }

  localStorage.setItem('chandeshwari_cart', JSON.stringify(cart));
  updateCartCount();
  renderCartItems();
}

function removeCartItem(cartItemId) {
  cart = cart.filter(item => item.cartItemId !== cartItemId);
  localStorage.setItem('chandeshwari_cart', JSON.stringify(cart));
  updateCartCount();
  renderCartItems();
  showToast('Item removed from cart.', 'info');
}

function renderCartItems() {
  const list = document.getElementById('cart-items-list');
  const footer = document.getElementById('cart-footer');
  const subtotalVal = document.getElementById('cart-subtotal-value');
  
  if (!list) return;
  list.innerHTML = '';

  if (cart.length === 0) {
    list.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Your cart is empty</p>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 8px;">Explore our catalog to add products.</p>
      </div>
    `;
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'block';
  let total = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    const li = document.createElement('div');
    li.className = 'cart-item';
    
    const displayVariant = item.variantLabel ? `<div class="cart-item-variant">Size: ${item.variantLabel}</div>` : '';
    const displayImg = item.image ? item.image : 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=100&q=80';

    li.innerHTML = `
      <div class="cart-item-img-box">
        <img src="${displayImg}" class="cart-item-img" alt="${item.name}">
      </div>
      <div class="cart-item-info">
        <h4 class="cart-item-name">${item.name}</h4>
        ${displayVariant}
        <div class="cart-item-pricing">
          <div class="cart-item-price">NPR ${item.price}</div>
          <div class="cart-item-actions">
            <button class="cart-item-qty-btn" onclick="adjustCartItemQty('${item.cartItemId}', -1)">-</button>
            <span class="cart-item-qty">${item.quantity}</span>
            <button class="cart-item-qty-btn" onclick="adjustCartItemQty('${item.cartItemId}', 1)">+</button>
            <button class="cart-item-remove" onclick="removeCartItem('${item.cartItemId}')" title="Remove">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
    list.appendChild(li);
  });

  subtotalVal.innerText = `NPR ${total}`;
}

// --- CHECKOUT & ORDER SUBMISSION VIA WHATSAPP ---
function openCheckout() {
  if (cart.length === 0) return;
  closeCart();
  document.getElementById('checkout-drawer').classList.add('active');
  document.getElementById('drawer-overlay').classList.add('active');
  
  // Render Summary inside checkout
  renderCheckoutSummary();
}

function closeCheckout() {
  document.getElementById('checkout-drawer').classList.remove('active');
  document.getElementById('drawer-overlay').classList.remove('active');
}

function renderCheckoutSummary() {
  const container = document.getElementById('checkout-summary-list');
  const totalVal = document.getElementById('checkout-total-val');
  if (!container) return;

  container.innerHTML = '';
  let subtotal = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justify = 'space-between';
    row.style.fontSize = '0.85rem';
    row.style.marginBottom = '8px';
    row.innerHTML = `
      <span style="color: var(--text-secondary); max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${item.name} ${item.variantLabel ? `(${item.variantLabel})` : ''} x${item.quantity}
      </span>
      <span style="font-weight: 600; color: var(--text-primary);">NPR ${itemTotal}</span>
    `;
    container.appendChild(row);
  });

  totalVal.innerText = `NPR ${subtotal}`;
}

function handleCheckoutSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('checkout-name').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();
  const city = document.getElementById('checkout-city').value.trim();
  const address = document.getElementById('checkout-address').value.trim();
  const notes = document.getElementById('checkout-notes').value.trim();

  // Basic Validation
  if (!name || !phone || !city || !address) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  if (!/^\d{10}$/.test(phone)) {
    showToast('Please enter a valid 10-digit phone number.', 'error');
    return;
  }

  // Compile items text
  let itemsDetails = '';
  let totalAmount = 0;
  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    totalAmount += itemTotal;
    itemsDetails += `${index + 1}. ${item.name} ${item.variantLabel ? `[Size: ${item.variantLabel}]` : ''} - Price: NPR ${item.price} - Qty: ${item.quantity} (Sub: NPR ${itemTotal})\n`;
  });

  // Generate tracking details
  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 89)}`;
  const dateStr = new Date().toISOString().split('T')[0];

  // Save to Simulated Database for Tracking
  const trackingDb = getTrackingDb();
  if (!trackingDb[phone]) {
    trackingDb[phone] = { orders: [], applications: [] };
  }
  trackingDb[phone].orders.unshift({
    id: orderId,
    date: dateStr,
    items: cart.map(i => `${i.name} ${i.variantLabel ? `(${i.variantLabel})` : ''} (Qty ${i.quantity})`).join(', '),
    total: totalAmount,
    status: 'pending'
  });
  saveToTrackingDb(trackingDb);

  // Format WhatsApp Message
  const message = `*NEW ORDER - CHANDESHWARI ARTS*\n` +
                  `----------------------------------------\n` +
                  `*Order ID:* ${orderId}\n` +
                  `*Date:* ${dateStr}\n\n` +
                  `*Customer Details:*\n` +
                  `- Name: ${name}\n` +
                  `- Phone: ${phone}\n` +
                  `- Shipping City: ${city}\n` +
                  `- Street Address: ${address}\n` +
                  `${notes ? `- Special Instructions: ${notes}\n` : ''}\n` +
                  `*Order Summary:*\n` +
                  `${itemsDetails}\n` +
                  `*TOTAL AMOUNT:* NPR ${totalAmount}\n` +
                  `----------------------------------------\n` +
                  `Please confirm my order and let me know the payment details. Thank you!`;

  // WhatsApp Link
  const encodedText = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${CONTACT_PHONE}?text=${encodedText}`;

  // Clear Cart
  cart = [];
  localStorage.setItem('chandeshwari_cart', JSON.stringify(cart));
  updateCartCount();
  closeCheckout();

  // Alert User & open WhatsApp
  showToast('Order compiled successfully! Redirecting to WhatsApp...', 'success');
  
  // Show order success modal
  setTimeout(() => {
    showOrderSuccessOverlay(orderId, phone);
    window.open(whatsappUrl, '_blank');
  }, 1000);
}

function showOrderSuccessOverlay(orderId, phone) {
  const successModal = document.createElement('div');
  successModal.className = 'modal-overlay active';
  successModal.style.zIndex = '1300';
  successModal.innerHTML = `
    <div class="modal-content" style="max-width: 500px; text-align: center; padding: 40px;">
      <div style="font-size: 4rem; color: var(--red-light); margin-bottom: 20px;">🎉</div>
      <h2 style="font-size: 1.75rem; margin-bottom: 12px;">Order Placed!</h2>
      <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 0.95rem;">
        Your order <strong>${orderId}</strong> has been generated and compiled for WhatsApp checkout. We have opened WhatsApp to send details.
      </p>
      <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 30px; font-size: 0.85rem; text-align: left;">
        <strong>How to track your order:</strong><br>
        Go to the <strong>Photos / Track Order</strong> page and enter your phone number: <strong>${phone}</strong>.
      </div>
      <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); window.location.hash='#home';" style="width: 100%; justify-content: center;">Go to Home</button>
    </div>
  `;
  document.body.appendChild(successModal);
}

// --- ID CARD PORTAL LOGIC ---

function switchIdTab(tabName, buttonElement) {
  // Toggle tab buttons
  const buttons = document.querySelectorAll('.id-tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  buttonElement.classList.add('active');

  // Toggle forms
  const forms = document.querySelectorAll('.form-card');
  forms.forEach(card => card.classList.remove('active'));
  
  if (tabName === 'student') {
    document.getElementById('student-form-card').classList.add('active');
  } else {
    document.getElementById('staff-form-card').classList.add('active');
  }
}

// Toggle Student Mode (Guest / Bulk)
function toggleStudentMode(mode) {
  const guestBtn = document.getElementById('student-mode-guest');
  const bulkBtn = document.getElementById('student-mode-bulk');
  const bulkFields = document.getElementById('student-bulk-fields');
  const guestFields = document.getElementById('student-guest-fields');
  
  if (mode === 'guest') {
    guestBtn.classList.add('btn-primary');
    guestBtn.classList.remove('btn-secondary');
    bulkBtn.classList.add('btn-secondary');
    bulkBtn.classList.remove('btn-primary');
    bulkFields.style.display = 'none';
    guestFields.style.display = 'block';
  } else {
    bulkBtn.classList.add('btn-primary');
    bulkBtn.classList.remove('btn-secondary');
    guestBtn.classList.add('btn-secondary');
    guestBtn.classList.remove('btn-primary');
    bulkFields.style.display = 'block';
    guestFields.style.display = 'none';
  }
}

// Handle Student Photo File Upload & Preview
function triggerStudentPhotoUpload() {
  document.getElementById('student-photo-input').click();
}

function handleStudentPhotoSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    showToast('Please upload an image file.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    studentPhotoBase64 = e.target.result;
    const previewImg = document.getElementById('student-preview-img');
    const previewFrame = document.getElementById('student-preview-frame');
    previewImg.src = studentPhotoBase64;
    previewFrame.classList.add('active');
    document.getElementById('student-upload-inner').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function resetStudentPhoto() {
  studentPhotoBase64 = null;
  document.getElementById('student-photo-input').value = '';
  document.getElementById('student-preview-frame').classList.remove('active');
  document.getElementById('student-upload-inner').style.display = 'flex';
}

// Add Student to Batch List
function addStudentToBatch() {
  const schoolName = document.getElementById('student-school').value.trim();
  const name = document.getElementById('student-name').value.trim();
  const roll = document.getElementById('student-roll').value.trim();
  const className = document.getElementById('student-class').value.trim();
  const section = document.getElementById('student-section').value.trim();
  const blood = document.getElementById('student-blood').value;
  const father = document.getElementById('student-father').value.trim();
  const mother = document.getElementById('student-mother').value.trim();
  const contact = document.getElementById('student-contact').value.trim();
  const address = document.getElementById('student-address').value.trim();
  const dob = document.getElementById('student-dob').value;

  if (!schoolName || !name || !className || !contact || !address) {
    showToast('Please fill in required student fields (School, Name, Class, Contact, Address).', 'error');
    return;
  }

  if (!studentPhotoBase64) {
    showToast('Please upload a student photo.', 'error');
    return;
  }

  if (!/^\d{10}$/.test(contact)) {
    showToast('Please enter a valid 10-digit contact number.', 'error');
    return;
  }

  // Create student item
  const student = {
    id: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
    schoolName,
    name,
    roll,
    className,
    section,
    blood,
    father,
    mother,
    contact,
    address,
    dob,
    photo: studentPhotoBase64
  };

  studentBatch.push(student);
  renderStudentBatchList();
  
  // Reset fields except school
  document.getElementById('student-name').value = '';
  document.getElementById('student-roll').value = '';
  document.getElementById('student-class').value = '';
  document.getElementById('student-section').value = '';
  document.getElementById('student-blood').value = 'A+';
  document.getElementById('student-father').value = '';
  document.getElementById('student-mother').value = '';
  document.getElementById('student-contact').value = '';
  document.getElementById('student-address').value = '';
  document.getElementById('student-dob').value = '';
  resetStudentPhoto();
  
  showToast(`Added ${name} to batch list. Total: ${studentBatch.length}`, 'success');
}

function removeStudentFromBatch(idx) {
  studentBatch.splice(idx, 1);
  renderStudentBatchList();
}

function renderStudentBatchList() {
  const container = document.getElementById('batch-students-list');
  const countSpan = document.getElementById('batch-count-val');
  const submitBtn = document.getElementById('batch-submit-btn');
  
  if (!container) return;
  container.innerHTML = '';
  countSpan.innerText = studentBatch.length;

  if (studentBatch.length === 0) {
    container.innerHTML = '<div class="no-results" style="grid-column: 1/-1; padding: 20px;">No students added to the batch yet.</div>';
    submitBtn.style.display = 'none';
    return;
  }

  submitBtn.style.display = 'block';

  studentBatch.forEach((s, idx) => {
    const card = document.createElement('div');
    card.className = 'student-batch-card';
    card.innerHTML = `
      <img src="${s.photo}" class="student-batch-avatar" alt="${s.name}">
      <div class="student-batch-details">
        <div class="student-batch-name">${s.name}</div>
        <div class="student-batch-sub">Roll: ${s.roll || 'N/A'} | Class: ${s.className}-${s.section || ''}</div>
        <div class="student-batch-sub">Contact: ${s.contact}</div>
        <button class="student-batch-remove" onclick="removeStudentFromBatch(${idx})" title="Remove">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function handleCsvImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const lines = text.split('\n');
    let importedCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = line.split(',');
      if (cols.length >= 5) {
        const schoolName = cols[0]?.trim();
        const name = cols[1]?.trim();
        const roll = cols[2]?.trim() || '';
        const className = cols[3]?.trim();
        const section = cols[4]?.trim() || '';
        const blood = cols[5]?.trim() || 'O+';
        const contact = cols[6]?.trim() || '9855024325';
        const address = cols[7]?.trim() || 'Simara';
        const dob = cols[8]?.trim() || '';

        if (schoolName && name && className) {
          studentBatch.push({
            id: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
            schoolName,
            name,
            roll,
            className,
            section,
            blood,
            father: '',
            mother: '',
            contact,
            address,
            dob,
            photo: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=100&q=80' // Placeholder
          });
          importedCount++;
        }
      }
    }

    renderStudentBatchList();
    showToast(`Successfully imported ${importedCount} students. Photo uploads required for completion.`, 'success');
  };
  reader.readAsText(file);
  event.target.value = ''; // Reset input
}

function submitStudentBatch() {
  if (studentBatch.length === 0) return;
  
  const mainContactPhone = studentBatch[0].contact; // Use first student's contact as search key
  const submissionId = `APP-STU-${Math.floor(1000 + Math.random() * 9000)}`;
  const schoolName = studentBatch[0].schoolName;

  // Add submissions to Tracking database
  const trackingDb = getTrackingDb();
  if (!trackingDb[mainContactPhone]) {
    trackingDb[mainContactPhone] = { orders: [], applications: [] };
  }

  studentBatch.forEach(s => {
    trackingDb[mainContactPhone].applications.unshift({
      id: submissionId,
      name: s.name,
      type: 'Student',
      schoolName: s.schoolName,
      status: 'pending',
      photo: s.photo
    });
  });

  saveToTrackingDb(trackingDb);
  
  // Format WhatsApp message
  const text = `*ID CARD SUBMISSION - CHANDESHWARI ARTS*\n` +
               `----------------------------------------\n` +
               `*School:* ${schoolName}\n` +
               `*Tracking ID:* ${submissionId}\n` +
               `*Total Students:* ${studentBatch.length}\n` +
               `*Contact:* ${mainContactPhone}\n` +
               `----------------------------------------\n` +
               `I have submitted ${studentBatch.length} student ID card records. Please review them. Thank you!`;

  const encodedText = encodeURIComponent(text);
  const waLink = `https://wa.me/${CONTACT_PHONE}?text=${encodedText}`;

  // Reset batch
  studentBatch = [];
  renderStudentBatchList();

  showToast('Applications submitted successfully!', 'success');

  // Success modal
  setTimeout(() => {
    const successModal = document.createElement('div');
    successModal.className = 'modal-overlay active';
    successModal.style.zIndex = '1300';
    successModal.innerHTML = `
      <div class="modal-content" style="max-width: 500px; text-align: center; padding: 40px;">
        <div style="font-size: 4rem; color: var(--red-light); margin-bottom: 20px;">🛡️</div>
        <h2 style="font-size: 1.75rem; margin-bottom: 12px;">Applications Sent!</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 0.95rem;">
          Your student records have been successfully saved under tracking ID: <strong>${submissionId}</strong>. We are opening WhatsApp to alert the design desk.
        </p>
        <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 30px; font-size: 0.85rem; text-align: left;">
          <strong>Tracking Details:</strong><br>
          Track submission status on the <strong>Photos / Track Order</strong> page using: <strong>${mainContactPhone}</strong>.
        </div>
        <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); window.location.hash='#home';" style="width: 100%; justify-content: center;">Go to Home</button>
      </div>
    `;
    document.body.appendChild(successModal);
    window.open(waLink, '_blank');
  }, 1000);
}

// GUEST STUDENT APPLICATION SUBMIT
function handleGuestStudentSubmit(event) {
  event.preventDefault();
  
  const schoolName = document.getElementById('student-guest-school').value.trim();
  const name = document.getElementById('student-guest-name').value.trim();
  const roll = document.getElementById('student-guest-roll').value.trim();
  const className = document.getElementById('student-guest-class').value.trim();
  const section = document.getElementById('student-guest-section').value.trim();
  const blood = document.getElementById('student-guest-blood').value;
  const contact = document.getElementById('student-guest-contact').value.trim();
  const address = document.getElementById('student-guest-address').value.trim();

  if (!schoolName || !name || !className || !contact || !address) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  if (!studentPhotoBase64) {
    showToast('Please upload a student photo.', 'error');
    return;
  }

  if (!/^\d{10}$/.test(contact)) {
    showToast('Please enter a valid 10-digit contact number.', 'error');
    return;
  }

  const submissionId = `APP-STU-${Math.floor(1000 + Math.random() * 9000)}`;

  // Save to db
  const trackingDb = getTrackingDb();
  if (!trackingDb[contact]) {
    trackingDb[contact] = { orders: [], applications: [] };
  }
  trackingDb[contact].applications.unshift({
    id: submissionId,
    name: name,
    type: 'Student',
    schoolName: schoolName,
    status: 'pending',
    photo: studentPhotoBase64
  });
  saveToTrackingDb(trackingDb);

  const text = `*INDIVIDUAL STUDENT ID SUBMISSION - CHANDESHWARI ARTS*\n` +
               `----------------------------------------\n` +
               `*School:* ${schoolName}\n` +
               `*Student Name:* ${name}\n` +
               `*Class:* ${className} [Roll: ${roll}]\n` +
               `*Tracking ID:* ${submissionId}\n` +
               `*Contact:* ${contact}\n` +
               `----------------------------------------\n` +
               `I have submitted my student ID card application. Please process it. Thank you!`;

  const waLink = `https://wa.me/${CONTACT_PHONE}?text=${encodeURIComponent(text)}`;

  // Reset form
  document.getElementById('student-guest-form').reset();
  resetStudentPhoto();

  showToast('Student application submitted successfully!', 'success');

  // Success Overlay
  setTimeout(() => {
    const successModal = document.createElement('div');
    successModal.className = 'modal-overlay active';
    successModal.style.zIndex = '1300';
    successModal.innerHTML = `
      <div class="modal-content" style="max-width: 500px; text-align: center; padding: 40px;">
        <div style="font-size: 4rem; color: var(--red-light); margin-bottom: 20px;">🎓</div>
        <h2 style="font-size: 1.75rem; margin-bottom: 12px;">Application Received!</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 0.95rem;">
          Your application has been received. Track code: <strong>${submissionId}</strong>. Opening WhatsApp to connect with the print lab.
        </p>
        <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); window.location.hash='#home';" style="width: 100%; justify-content: center;">Go to Home</button>
      </div>
    `;
    document.body.appendChild(successModal);
    window.open(waLink, '_blank');
  }, 1000);
}

// STAFF APPLICATION LOGIC
function triggerStaffPhotoUpload() {
  document.getElementById('staff-photo-input').click();
}

function handleStaffPhotoSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please upload an image file.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    staffPhotoBase64 = e.target.result;
    const previewImg = document.getElementById('staff-preview-img');
    const previewFrame = document.getElementById('staff-preview-frame');
    previewImg.src = staffPhotoBase64;
    previewFrame.classList.add('active');
    document.getElementById('staff-upload-inner').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function resetStaffPhoto() {
  staffPhotoBase64 = null;
  document.getElementById('staff-photo-input').value = '';
  document.getElementById('staff-preview-frame').classList.remove('active');
  document.getElementById('staff-upload-inner').style.display = 'flex';
}

function handleStaffSubmit(event) {
  event.preventDefault();

  const schoolName = document.getElementById('staff-school').value.trim();
  const nameEn = document.getElementById('staff-name-en').value.trim();
  const nameNp = document.getElementById('staff-name-np').value.trim();
  const designationEn = document.getElementById('staff-designation-en').value.trim();
  const designationNp = document.getElementById('staff-designation-np').value.trim();
  const contact = document.getElementById('staff-contact').value.trim();
  const addressEn = document.getElementById('staff-address-en').value.trim();
  const blood = document.getElementById('staff-blood').value;

  if (!schoolName || !nameEn || !designationEn || !contact || !addressEn) {
    showToast('Please fill in required fields.', 'error');
    return;
  }

  if (!staffPhotoBase64) {
    showToast('Please upload a staff photo.', 'error');
    return;
  }

  if (!/^\d{10}$/.test(contact)) {
    showToast('Please enter a valid 10-digit contact number.', 'error');
    return;
  }

  const submissionId = `APP-STF-${Math.floor(1000 + Math.random() * 9000)}`;

  // Save to db
  const trackingDb = getTrackingDb();
  if (!trackingDb[contact]) {
    trackingDb[contact] = { orders: [], applications: [] };
  }
  trackingDb[contact].applications.unshift({
    id: submissionId,
    name: nameEn,
    type: 'Staff',
    designation: designationEn,
    status: 'pending',
    photo: staffPhotoBase64
  });
  saveToTrackingDb(trackingDb);

  const text = `*STAFF ID CARD SUBMISSION - CHANDESHWARI ARTS*\n` +
               `----------------------------------------\n` +
               `*School/Office:* ${schoolName}\n` +
               `*Employee:* ${nameEn} (${nameNp || ''})\n` +
               `*Designation:* ${designationEn}\n` +
               `*Tracking ID:* ${submissionId}\n` +
               `*Contact:* ${contact}\n` +
               `----------------------------------------\n` +
               `I have submitted my staff ID card application details. Please review. Thank you!`;

  const waLink = `https://wa.me/${CONTACT_PHONE}?text=${encodeURIComponent(text)}`;

  // Reset form
  document.getElementById('staff-form').reset();
  resetStaffPhoto();

  showToast('Staff ID application submitted successfully!', 'success');

  // Success Modal
  setTimeout(() => {
    const successModal = document.createElement('div');
    successModal.className = 'modal-overlay active';
    successModal.style.zIndex = '1300';
    successModal.innerHTML = `
      <div class="modal-content" style="max-width: 500px; text-align: center; padding: 40px;">
        <div style="font-size: 4rem; color: var(--red-light); margin-bottom: 20px;">👔</div>
        <h2 style="font-size: 1.75rem; margin-bottom: 12px;">Staff Application Sent!</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 0.95rem;">
          Your application has been received under tracking ID: <strong>${submissionId}</strong>. We are opening WhatsApp to contact the printing department.
        </p>
        <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); window.location.hash='#home';" style="width: 100%; justify-content: center;">Go to Home</button>
      </div>
    `;
    document.body.appendChild(successModal);
    window.open(waLink, '_blank');
  }, 1000);
}

// --- ORDER STATUS / PHOTO TRACKING ---
function handleTrackingSubmit(event) {
  event.preventDefault();
  const phone = document.getElementById('tracking-phone').value.trim();
  const resultsDiv = document.getElementById('tracking-results-box');
  
  if (!phone || !/^\d{10}$/.test(phone)) {
    showToast('Please enter a valid 10-digit phone number.', 'error');
    return;
  }

  // Fetch from localStorage db
  const trackingDb = getTrackingDb();
  const record = trackingDb[phone];

  resultsDiv.classList.add('active');

  const ordersContainer = document.getElementById('tracking-orders-list');
  const photosContainer = document.getElementById('tracking-photos-grid');

  ordersContainer.innerHTML = '';
  photosContainer.innerHTML = '';

  let hasOrders = false;
  let hasApplications = false;

  if (record) {
    // Render Orders
    if (record.orders && record.orders.length > 0) {
      hasOrders = true;
      record.orders.forEach(o => {
        const card = document.createElement('div');
        card.className = 'order-history-card';
        card.innerHTML = `
          <div class="order-history-header">
            <span class="order-id">${o.id}</span>
            <span class="order-date">${o.date}</span>
          </div>
          <div class="order-items">${o.items}</div>
          <div class="order-footer-row">
            <span class="order-price">NPR ${o.total}</span>
            <span class="order-status status-${o.status}">${o.status}</span>
          </div>
        `;
        ordersContainer.appendChild(card);
      });
    }

    // Render Applications / Photos
    if (record.applications && record.applications.length > 0) {
      hasApplications = true;
      record.applications.forEach(a => {
        const card = document.createElement('div');
        card.className = 'track-photo-card';
        card.innerHTML = `
          <img src="${a.photo}" class="track-photo-img" alt="${a.name}">
          <div class="track-photo-name">${a.name}</div>
          <div style="font-size: 0.65rem; color: var(--text-muted); margin-bottom: 6px;">${a.type} Card</div>
          <button class="photo-download-btn" onclick="downloadMockCard('${a.name}', '${a.type}')">Download</button>
        `;
        photosContainer.appendChild(card);
      });
    }
  }

  if (!hasOrders) {
    ordersContainer.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.9rem;">No printing orders found for this number.</div>';
  }
  if (!hasApplications) {
    photosContainer.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.9rem; grid-column: 1/-1;">No photo files or ID cards ready for download.</div>';
  }

  showToast('Tracking data loaded.', 'success');
}

function downloadMockCard(name, type) {
  // Simulate card download
  const element = document.createElement('a');
  const fileContent = `--- CHANDESHWARI ARTS ID CARD DOWNLOAD ---\n` +
                      `Name: ${name}\n` +
                      `Card Type: ${type}\n` +
                      `Status: Print Approved / High-Definition JPEG\n` +
                      `Prepared on: ${new Date().toISOString().split('T')[0]}\n` +
                      `Chandeswori Digital Flex Print & Studio - Simara`;
                      
  const file = new Blob([fileContent], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = `${name.replace(/\s+/g, '_')}_${type}_Card.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  
  showToast(`Downloading print copy of ${name}'s ID card.`, 'success');
}

// --- CONTACT FORM ---
function handleContactSubmit(event) {
  event.preventDefault();
  
  const name = document.getElementById('contact-name').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const subject = document.getElementById('contact-subject').value.trim();
  const message = document.getElementById('contact-message').value.trim();

  if (!name || !email || !subject || !message) {
    showToast('Please fill in all fields.', 'error');
    return;
  }

  showToast('Sending message...', 'info');

  setTimeout(() => {
    showToast('Thank you! Your message has been sent to Chandeshwari Arts.', 'success');
    document.getElementById('contact-form').reset();
  }, 1000);
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
  
  const icon = type === 'success' ? '✔' : (type === 'error' ? '✖' : 'ℹ');
  const iconClass = type === 'success' ? 'success' : 'error';
  
  toast.innerHTML = `
    <span class="toast-icon ${iconClass}">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Animate slide up
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  // Fade out and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    toast.style.transition = 'all 0.5s ease';
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 3500);
}

// --- SETUP EVENT LISTENERS ---
function setupEventListeners() {
  const themeToggles = document.querySelectorAll('.theme-btn');
  themeToggles.forEach(btn => btn.onclick = toggleTheme);
  
  const menuBtn = document.querySelector('.menu-toggle');
  if (menuBtn) menuBtn.onclick = toggleMobileMenu;
}

// Make functions globally accessible
window.selectCategory = selectCategory;
window.handleSearch = handleSearch;
window.openProductDetail = openProductDetail;
window.closeProductDetail = closeProductDetail;
window.selectVariant = selectVariant;
window.adjustDetailQty = adjustDetailQty;
window.addToCart = addToCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.adjustCartItemQty = adjustCartItemQty;
window.removeCartItem = removeCartItem;
window.openCheckout = openCheckout;
window.closeCheckout = closeCheckout;
window.handleCheckoutSubmit = handleCheckoutSubmit;
window.switchIdTab = switchIdTab;
window.toggleStudentMode = toggleStudentMode;
window.triggerStudentPhotoUpload = triggerStudentPhotoUpload;
window.handleStudentPhotoSelect = handleStudentPhotoSelect;
window.resetStudentPhoto = resetStudentPhoto;
window.addStudentToBatch = addStudentToBatch;
window.removeStudentFromBatch = removeStudentFromBatch;
window.handleCsvImport = handleCsvImport;
window.submitStudentBatch = submitStudentBatch;
window.handleGuestStudentSubmit = handleGuestStudentSubmit;
window.triggerStaffPhotoUpload = triggerStaffPhotoUpload;
window.handleStaffPhotoSelect = handleStaffPhotoSelect;
window.resetStaffPhoto = resetStaffPhoto;
window.handleStaffSubmit = handleStaffSubmit;
window.handleTrackingSubmit = handleTrackingSubmit;
window.downloadMockCard = downloadMockCard;
window.handleContactSubmit = handleContactSubmit;
window.toggleTheme = toggleTheme;
window.scrollFeaturedSlider = scrollFeaturedSlider;

// --- HERO SUBTITLE CAROUSEL ---
function initHeroCarousel() {
  const carouselEl = document.getElementById('hero-carousel-text');
  if (!carouselEl) return;

  const items = [
    'SUBLIMATION T-SHIRT',
    'LANYARD DORI',
    'PHOTO FRAMING',
    'METAL BADGES',
    'DIGITAL ID CARDS',
    'FLEX BANNERS'
  ];

  let currentIndex = 0;
  
  // Set initial styles for transition
  carouselEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  carouselEl.style.display = 'inline-block';
  
  setInterval(() => {
    // Fade out text
    carouselEl.style.opacity = '0';
    carouselEl.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
      currentIndex = (currentIndex + 1) % items.length;
      carouselEl.innerText = items[currentIndex];
      
      // Fade in text
      carouselEl.style.opacity = '1';
      carouselEl.style.transform = 'translateY(0)';
    }, 400); // match transition duration
  }, 3500); // change text every 3.5s
}

// --- FEATURED PRODUCTS CAROUSEL SCROLL ---
function scrollFeaturedSlider() {
  const slider = document.getElementById('featured-slider');
  if (!slider) return;
  
  // Scroll right by 320px (width of one card + gap)
  const maxScroll = slider.scrollWidth - slider.clientWidth;
  
  if (slider.scrollLeft >= maxScroll - 5) {
    // If at the end, scroll back to the beginning
    slider.scrollTo({ left: 0, behavior: 'smooth' });
  } else {
    slider.scrollBy({ left: 320, behavior: 'smooth' });
  }
}
