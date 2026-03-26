// ═══════════════════════════════════════════════════════
// FreshGrove Admin Panel JS
// ═══════════════════════════════════════════════════════

let refreshInterval = null;

// ── Authentication ──
function attemptLogin() {
    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('login-error');

    fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    })
    .then(res => {
        if (res.ok) {
            document.getElementById('login-overlay').style.display = 'none';
            sessionStorage.setItem('admin_auth', 'true');
            fetchOrders();
            startAutoRefresh();
        } else {
            errorEl.style.display = 'block';
            document.getElementById('admin-password').value = '';
            document.getElementById('admin-password').focus();
        }
    })
    .catch(() => {
        errorEl.textContent = 'Connection error. Please try again.';
        errorEl.style.display = 'block';
    });
}

// Allow Enter key to submit
document.getElementById('admin-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptLogin();
});

// Check if already authenticated this session
window.onload = () => {
    if (sessionStorage.getItem('admin_auth') === 'true') {
        document.getElementById('login-overlay').style.display = 'none';
        fetchOrders();
        startAutoRefresh();
    }
};

// ── Auto Refresh ──
function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(fetchOrders, 5000);
}

// ── Fetch Orders ──
async function fetchOrders() {
    const tbody = document.getElementById('orders-tbody');
    try {
        const res = await fetch('/api/admin/orders');
        const orders = await res.json();

        updateStats(orders);

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 4rem; color: var(--text-light);"><i class="fas fa-inbox" style="font-size: 2rem; display: block; margin-bottom: 1rem; opacity: 0.3;"></i>No orders have been placed yet.</td></tr>';
            return;
        }

        tbody.innerHTML = '';

        orders.forEach(order => {
            const date = new Date(order.created_at);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let itemsHtml = '<ul class="order-items-list">';
            order.items.forEach(item => {
                itemsHtml += `<li><strong>${item.quantity}x</strong> ${item.name}</li>`;
            });
            itemsHtml += '</ul>';

            const status = order.status || 'placed';
            const actionBtns = getActionButtons(order.id, status);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong style="font-size: 1.1rem; color: var(--dark);">#${order.id}</strong></td>
                <td style="color: var(--text-light); font-size: 0.92rem;">${formattedDate}</td>
                <td>
                    <div style="font-weight: 600; color: var(--dark);">${order.customer_info?.name || 'Guest'}</div>
                </td>
                <td>${itemsHtml}</td>
                <td style="font-weight: 800; font-size: 1.15rem; color: var(--primary);">
                    $${order.total_amount.toFixed(2)}
                </td>
                <td>
                    <span class="status-badge status-${status}">${status}</span>
                </td>
                <td>
                    <div class="action-btns">${actionBtns}</div>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("Error fetching orders:", err);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger); padding: 3rem;"><i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>Failed to load orders.</td></tr>';
    }
}

// ── Generate Action Buttons Based on Status ──
function getActionButtons(orderId, status) {
    switch (status) {
        case 'placed':
            return `
                <button class="action-btn btn-accept" onclick="updateStatus(${orderId}, 'accepted')"><i class="fas fa-check"></i> Accept</button>
                <button class="action-btn btn-reject" onclick="updateStatus(${orderId}, 'rejected')"><i class="fas fa-times"></i> Reject</button>
            `;
        case 'accepted':
            return `
                <button class="action-btn btn-deliver" onclick="updateStatus(${orderId}, 'delivered')"><i class="fas fa-truck"></i> Delivered</button>
            `;
        case 'rejected':
            return `<span style="color: var(--text-light); font-size: 0.85rem;">Closed</span>`;
        case 'delivered':
            return `<span style="color: var(--text-light); font-size: 0.85rem;"><i class="fas fa-check-double" style="color: var(--primary); margin-right: 4px;"></i>Completed</span>`;
        default:
            return '';
    }
}

// ── Update Order Status ──
async function updateStatus(orderId, newStatus) {
    try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            fetchOrders(); // Reload table immediately
        } else {
            const data = await res.json();
            alert('Error: ' + (data.detail || 'Failed to update status'));
        }
    } catch (err) {
        console.error('Error updating status:', err);
        alert('Network error while updating order status.');
    }
}

// ── Update Stats Cards ──
function updateStats(orders) {
    document.getElementById('stat-total').textContent = orders.length;
    document.getElementById('stat-placed').textContent = orders.filter(o => o.status === 'placed').length;
    document.getElementById('stat-accepted').textContent = orders.filter(o => o.status === 'accepted').length;
    document.getElementById('stat-delivered').textContent = orders.filter(o => o.status === 'delivered').length;
}
