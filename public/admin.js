const API_BASE = '/api'; // Adjust if needed

let token = localStorage.getItem('token');

// Check if user is logged in
if (!token) {
  window.location.href = 'admin-login.html';
} else {
  loadDashboard();
}


document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  token = null;
  window.location.href = 'admin-login.html';
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + '-tab').style.display = 'block';
  });
});

document.getElementById('product-form').addEventListener('submit', async (e) => {
   e.preventDefault();
   const formData = new FormData();
   formData.append('name', document.getElementById('product-name').value);
   formData.append('shortDescription', document.getElementById('product-short-description').value);
   formData.append('longDescription', document.getElementById('product-long-description').value);
   formData.append('brand', document.getElementById('product-brand').value);
   const colors = document.getElementById('product-colors').value.split(',').map(c => c.trim()).filter(c => c);
   colors.forEach(color => formData.append('colors', color));
   const sizes = document.getElementById('product-sizes').value.split(',').map(s => s.trim()).filter(s => s);
   sizes.forEach(size => formData.append('sizes', size));
   formData.append('price', parseFloat(document.getElementById('product-price').value));
   formData.append('stock', parseInt(document.getElementById('product-stock').value));
   formData.append('category', document.getElementById('product-category').value);
   formData.append('image', document.getElementById('product-image').files[0]);
   const additionalImages = document.getElementById('product-additional-images').files;
   for (let i = 0; i < additionalImages.length; i++) {
     formData.append('additionalImages', additionalImages[i]);
   }
   const videos = document.getElementById('product-videos').value.split('\n').map(v => v.trim()).filter(v => v);
   videos.forEach(video => formData.append('videos', video));
   formData.append('isWholesale', document.getElementById('product-wholesale').checked);
   formData.append('minOrderQty', parseInt(document.getElementById('product-moq').value) || 1);
   formData.append('isNewArrival', document.getElementById('product-new-arrival').checked);
   formData.append('isFastSelling', document.getElementById('product-fast-selling').checked);
   formData.append('isShopByCategory', document.getElementById('product-shop-category').checked);
   try {
     const res = await fetch(`${API_BASE}/products`, {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${token}`
       },
       body: formData
     });
     if (res.ok) {
       loadProducts();
       document.getElementById('product-form').reset();
       document.getElementById('product-moq').value = '1';
     }
   } catch (err) {
     console.error(err);
   }
 });

document.getElementById('create-staff-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('staff-name').value;
  const email = document.getElementById('staff-email').value;
  const password = document.getElementById('staff-password').value;
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, email, password, role: 'staff' })
    });
    if (res.ok) {
      alert('Staff account created successfully');
      document.getElementById('create-staff-form').reset();
    } else {
      const data = await res.json();
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
  }
});

async function loadDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.role === 'superadmin') {
    document.getElementById('create-staff-section').style.display = 'block';
    document.querySelector('[data-tab="users"]').style.display = 'inline-block';
  } else {
    document.querySelector('[data-tab="users"]').style.display = 'none';
  }
  loadProducts();
  loadOrders();
  loadMessages();
  loadUsers();
  loadProfile();
}

async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const products = await res.json();
    const list = document.getElementById('products-list');
    list.innerHTML = products.map(p => `
      <div class="product-item">
        <h3>${p.name}</h3>
        <p><strong>Short Desc:</strong> ${p.shortDescription}</p>
        ${p.longDescription ? `<p><strong>Long Desc:</strong> ${p.longDescription}</p>` : ''}
        ${p.brand ? `<p><strong>Brand:</strong> ${p.brand}</p>` : ''}
        ${p.colors && p.colors.length ? `<p><strong>Colors:</strong> ${p.colors.join(', ')}</p>` : ''}
        ${p.sizes && p.sizes.length ? `<p><strong>Sizes:</strong> ${p.sizes.join(', ')}</p>` : ''}
        <p><strong>Price:</strong> GHS ${p.price}</p>
        <p><strong>Stock:</strong> ${p.stock}</p>
        <p><strong>Category:</strong> ${p.category}</p>
        <p><strong>Wholesale:</strong> ${p.isWholesale ? 'Yes (MOQ: ' + p.minOrderQty + ')' : 'No'}</p>
        <p><strong>Sections:</strong> ${[
          p.isNewArrival ? 'New Arrivals' : '',
          p.isFastSelling ? 'Fast-Selling Items' : '',
          p.isShopByCategory ? 'Shop by Category' : ''
        ].filter(s => s).join(', ') || 'None'}</p>
        <button onclick="updateStock('${p._id}', ${p.stock})">Update Stock</button>
        <button onclick="deleteProduct('${p._id}')">Delete</button>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

async function loadOrders() {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const orders = await res.json();
    const list = document.getElementById('orders-list');
    list.innerHTML = orders.map(o => `
      <div class="order-item">
        <p>User: ${o.user.name}</p>
        <p>Total: $${o.total}</p>
        <p>Status: ${o.status}</p>
        <select onchange="updateOrderStatus('${o._id}', this.value)">
          <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processing</option>
          <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
          <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
          <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

async function loadMessages() {
  try {
    const res = await fetch(`${API_BASE}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const messages = await res.json();
    const list = document.getElementById('messages-list');
    list.innerHTML = messages.map(m => `
      <div class="message-item">
        <p><strong>${m.sender}:</strong> ${m.message}</p>
        <p>Response: ${m.response || 'No response yet'}</p>
        <textarea placeholder="Respond" id="response-${m._id}"></textarea>
        <button onclick="respondToMessage('${m._id}')">Respond</button>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

async function updateStock(id, currentStock) {
  const newStock = prompt('Enter new stock:', currentStock);
  if (newStock !== null) {
    try {
      await fetch(`${API_BASE}/products/${id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stock: parseInt(newStock) })
      });
      loadProducts();
    } catch (err) {
      console.error(err);
    }
  }
}

async function deleteProduct(id) {
  if (confirm('Delete this product?')) {
    try {
      await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadProducts();
    } catch (err) {
      console.error(err);
    }
  }
}

async function updateOrderStatus(id, status) {
  try {
    await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
  } catch (err) {
    console.error(err);
  }
}

async function respondToMessage(id) {
  const response = document.getElementById(`response-${id}`).value;
  try {
    await fetch(`${API_BASE}/messages/${id}/respond`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ response })
    });
    loadMessages();
  } catch (err) {
    console.error(err);
  }
}

async function loadUsers() {
  try {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const users = await res.json();
    const list = document.getElementById('users-list');
    list.innerHTML = users.map(u => `
      <div class="user-item">
        <h3>${u.name} (${u.role})</h3>
        <p>${u.email}</p>
        <button onclick="deleteUser('${u._id}')">Delete</button>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

async function deleteUser(id) {
  if (confirm('Delete this user?')) {
    try {
      await fetch(`${API_BASE}/auth/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  }
}

function loadProfile() {
  const user = JSON.parse(localStorage.getItem('user'));
  document.getElementById('profile-info').innerHTML = `
    <div class="profile-card">
      <div class="profile-avatar">
        <div class="avatar-circle">${user.name.charAt(0).toUpperCase()}</div>
      </div>
      <div class="profile-details">
        <h3>${user.name}</h3>
        <p class="profile-email">${user.email}</p>
        <span class="profile-role role-${user.role}">${user.role}</span>
        <p class="profile-joined">Member since ${new Date().getFullYear()}</p>
      </div>
    </div>
  `;
}

document.getElementById('delete-account-btn').addEventListener('click', async () => {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    const user = JSON.parse(localStorage.getItem('user'));
    try {
      const res = await fetch(`${API_BASE}/auth/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Account deleted successfully.');
        localStorage.clear();
        window.location.href = 'admin-login.html';
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting account.');
    }
  }
});