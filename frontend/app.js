// API Base URL
const API_BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

let ws = null;
let currentTrackingNumber = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;

// DOM Elements
const authSection = document.getElementById('authSection');
const mainContent = document.getElementById('mainContent');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const trackingForm = document.getElementById('trackingForm');
const createDeliveryForm = document.getElementById('createDeliveryForm');
const deliveryDetails = document.getElementById('deliveryDetails');
const statusSelect = document.getElementById('statusSelect');
const updateStatusBtn = document.getElementById('updateStatusBtn');
const cancelDeliveryBtn = document.getElementById('cancelDeliveryBtn');
const returnDeliveryBtn = document.getElementById('returnDeliveryBtn');

// Check authentication status on page load
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (token && user) {
        showMainContent(user);
    } else {
        showAuthSection();
    }
}

// Show/hide sections
function showMainContent(user) {
    authSection.style.display = 'none';
    mainContent.style.display = 'block';
    userInfo.style.display = 'flex';
    userName.textContent = user.name;
}

function showAuthSection() {
    authSection.style.display = 'block';
    mainContent.style.display = 'none';
    userInfo.style.display = 'none';
}

// WebSocket connection handling
function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('WebSocket bereits verbunden');
        return;
    }

    console.log('Starte WebSocket Verbindung...');
    
    if (ws) {
        console.log('Bestehende Verbindung wird geschlossen');
        ws.close();
    }

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('WebSocket verbunden');
        reconnectAttempts = 0;
        if (currentTrackingNumber) {
            console.log('Wiederverbindung: Abonniere aktuelle Lieferung:', currentTrackingNumber);
            subscribeToDelivery(currentTrackingNumber);
        }
    };

    ws.onmessage = (event) => {
        console.log('WebSocket Nachricht empfangen:', event.data);
        const message = JSON.parse(event.data);
        console.log('Parsed Nachricht:', message);

        if (message.type === 'subscriptionConfirmed') {
            console.log('Subscription bestätigt für:', message.trackingNumber);
        } else if (message.type === 'deliveryUpdate' && message.trackingNumber === currentTrackingNumber) {
            console.log('Lieferungsupdate für aktuelle Lieferung empfangen');
            displayDeliveryDetails(message.delivery);
        }
    };

    ws.onclose = (event) => {
        console.log('WebSocket Verbindung geschlossen', event.code, event.reason);
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`Versuche in ${RECONNECT_DELAY/1000} Sekunden erneut zu verbinden (Versuch ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            setTimeout(connectWebSocket, RECONNECT_DELAY);
        } else {
            console.log('Maximale Anzahl an Wiederverbindungsversuchen erreicht');
            alert('Die Verbindung zum Server konnte nicht hergestellt werden. Bitte laden Sie die Seite neu.');
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket Fehler:', error);
    };
}

// Initialize WebSocket connection
connectWebSocket();

// Subscribe to delivery updates
function subscribeToDelivery(trackingNumber) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.log('WebSocket nicht verbunden, verbinde neu...');
        connectWebSocket();
        return;
    }

    console.log('Versuche Lieferung zu abonnieren:', trackingNumber);
    console.log('WebSocket Status:', ws.readyState);

    const subscribeMessage = {
        type: 'subscribe',
        trackingNumber: trackingNumber
    };

    try {
        console.log('Sende Subscribe Nachricht:', JSON.stringify(subscribeMessage));
        ws.send(JSON.stringify(subscribeMessage));
        console.log('Subscribe Nachricht gesendet');
    } catch (error) {
        console.error('Fehler beim Senden der Subscribe Nachricht:', error);
        connectWebSocket();
    }
}

// Unsubscribe from delivery updates
function unsubscribeFromDelivery(trackingNumber) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const unsubscribeMessage = {
        type: 'unsubscribe',
        trackingNumber: trackingNumber
    };

    try {
        ws.send(JSON.stringify(unsubscribeMessage));
        console.log('Unsubscribe Nachricht gesendet für:', trackingNumber);
    } catch (error) {
        console.error('Fehler beim Senden der Unsubscribe Nachricht:', error);
    }
}

// Auth form handlers
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password')
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showMainContent(data.user);
        } else {
            alert(data.message || 'Login fehlgeschlagen');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Ein Fehler ist aufgetreten');
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password')
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showMainContent(data.user);
        } else {
            alert(data.message || 'Registrierung fehlgeschlagen');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Ein Fehler ist aufgetreten');
    }
});

// Logout handler
logoutBtn.addEventListener('click', () => {
    if (currentTrackingNumber) {
        unsubscribeFromDelivery(currentTrackingNumber);
    }
    if (ws) {
        ws.close();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showAuthSection();
});

// Auth tabs
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        if (tab.dataset.tab === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    });
});

// Tracking form handler
trackingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const trackingNumber = document.getElementById('trackingNumber').value;
    
    if (currentTrackingNumber && currentTrackingNumber !== trackingNumber) {
        unsubscribeFromDelivery(currentTrackingNumber);
    }
    
    currentTrackingNumber = trackingNumber;
    
    try {
        const token = localStorage.getItem('token');
        console.log('Token aus localStorage:', token);
        
        if (!token) {
            console.log('Kein Token gefunden');
            alert('Bitte melden Sie sich an, um Lieferungen zu verfolgen');
            showAuthSection();
            return;
        }

        console.log('Sende Request mit Token:', `Bearer ${token}`);
        const response = await fetch(`${API_BASE_URL}/deliveries/${trackingNumber}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Response Status:', response.status);
        const data = await response.json();
        console.log('Response Data:', data);
        
        if (response.ok) {
            displayDeliveryDetails(data);
            subscribeToDelivery(trackingNumber);
        } else {
            alert(data.message || 'Lieferung nicht gefunden');
        }
    } catch (error) {
        console.error('Tracking error:', error);
        alert('Ein Fehler ist aufgetreten');
    }
});

// Create delivery form handler
createDeliveryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(createDeliveryForm);
    
    const deliveryData = {
        sender: {
            name: formData.get('senderName'),
            address: formData.get('senderAddress'),
            phone: formData.get('senderPhone'),
            email: formData.get('senderEmail')
        },
        recipient: {
            name: formData.get('recipientName'),
            address: formData.get('recipientAddress'),
            phone: formData.get('recipientPhone'),
            email: formData.get('recipientEmail')
        },
        package: {
            weight: parseFloat(formData.get('packageWeight')),
            dimensions: {
                length: parseInt(formData.get('packageLength')),
                width: parseInt(formData.get('packageWidth')),
                height: parseInt(formData.get('packageHeight'))
            },
            description: formData.get('packageDescription')
        },
        estimatedDeliveryTime: formData.get('estimatedDeliveryTime')
    };

    try {
        const response = await fetch(`${API_BASE_URL}/deliveries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(deliveryData)
        });

        const data = await response.json();
        
        if (response.ok) {
            alert(`Lieferung erstellt! Tracking-Nummer: ${data.trackingNumber}`);
            createDeliveryForm.reset();
            displayDeliveryDetails(data);
            currentTrackingNumber = data.trackingNumber;
            subscribeToDelivery(data.trackingNumber);
        } else {
            alert(data.message || 'Fehler beim Erstellen der Lieferung');
        }
    } catch (error) {
        console.error('Create delivery error:', error);
        alert('Ein Fehler ist aufgetreten');
    }
});

// Display delivery details
function displayDeliveryDetails(delivery) {
    deliveryDetails.style.display = 'block';
    
    // Update status
    document.getElementById('deliveryStatus').textContent = delivery.status;
    statusSelect.value = delivery.status;
    
    // Update sender details
    document.getElementById('senderName').textContent = delivery.sender.name;
    document.getElementById('senderAddress').textContent = delivery.sender.address;
    document.getElementById('senderPhone').textContent = delivery.sender.phone;
    
    // Update recipient details
    document.getElementById('recipientName').textContent = delivery.recipient.name;
    document.getElementById('recipientAddress').textContent = delivery.recipient.address;
    document.getElementById('recipientPhone').textContent = delivery.recipient.phone;
    
    // Update package details
    document.getElementById('packageWeight').textContent = `${delivery.package.weight} kg`;
    document.getElementById('packageDimensions').textContent = 
        `${delivery.package.dimensions.length}x${delivery.package.dimensions.width}x${delivery.package.dimensions.height} cm`;
    document.getElementById('packageDescription').textContent = delivery.package.description;
    
    // Update tracking history
    const historyList = document.getElementById('trackingHistoryList');
    historyList.innerHTML = '';
    delivery.trackingHistory.forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `${new Date(entry.timestamp).toLocaleString()}: ${entry.status}`;
        historyList.appendChild(li);
    });
}

// Status update handler
updateStatusBtn.addEventListener('click', async () => {
    const trackingNumber = document.getElementById('trackingNumber').value;
    const newStatus = statusSelect.value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/deliveries/${trackingNumber}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();
        
        if (response.ok) {
            displayDeliveryDetails(data);
        } else {
            alert(data.message || 'Fehler beim Aktualisieren des Status');
        }
    } catch (error) {
        console.error('Status update error:', error);
        alert('Ein Fehler ist aufgetreten');
    }
});

// Cancel delivery handler
cancelDeliveryBtn.addEventListener('click', async () => {
    const trackingNumber = document.getElementById('trackingNumber').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/deliveries/${trackingNumber}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            displayDeliveryDetails(data);
        } else {
            alert(data.message || 'Fehler beim Stornieren der Lieferung');
        }
    } catch (error) {
        console.error('Cancel delivery error:', error);
        alert('Ein Fehler ist aufgetreten');
    }
});

// Return delivery handler
returnDeliveryBtn.addEventListener('click', async () => {
    const trackingNumber = document.getElementById('trackingNumber').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/deliveries/${trackingNumber}/return`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            displayDeliveryDetails(data);
        } else {
            alert(data.message || 'Fehler beim Zurücksenden der Lieferung');
        }
    } catch (error) {
        console.error('Return delivery error:', error);
        alert('Ein Fehler ist aufgetreten');
    }
});

window.addEventListener('beforeunload', () => {
    if (currentTrackingNumber) {
        unsubscribeFromDelivery(currentTrackingNumber);
    }
    if (ws) {
        ws.close();
    }
});

// Check auth status on page load
checkAuth(); 