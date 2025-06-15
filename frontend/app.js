// API Base URL
const API_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

// WebSocket Verbindung
let ws = null;
let currentTrackingNumber = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;

function connectWebSocket() {
    console.log('Starte WebSocket Verbindung...');
    if (ws) {
        console.log('Bestehende Verbindung wird geschlossen');
        ws.close();
    }

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('WebSocket verbunden');
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        
        if (currentTrackingNumber) {
            console.log('Wiederverbindung: Abonniere aktuelle Lieferung:', currentTrackingNumber);
            subscribeToDelivery(currentTrackingNumber);
        }
    };

    ws.onmessage = (event) => {
        console.log('WebSocket Nachricht empfangen:', event.data);
        try {
            const data = JSON.parse(event.data);
            console.log('Parsed Nachricht:', data);
            
            if (data.type === 'subscriptionConfirmed') {
                console.log('Subscription bestätigt für:', data.trackingNumber);
            } else if (data.type === 'deliveryUpdate' && data.trackingNumber === currentTrackingNumber) {
                console.log('Lieferungsupdate für aktuelle Lieferung empfangen');
                // Aktualisiere die Anzeige mit den neuen Daten
                fetch(`${API_URL}/deliveries/${data.trackingNumber}`)
                    .then(response => response.json())
                    .then(delivery => {
                        console.log('Neue Lieferungsdaten empfangen:', delivery);
                        displayDeliveryDetails(delivery);
                    })
                    .catch(error => {
                        console.error('Fehler beim Aktualisieren der Lieferungsdetails:', error);
                    });
            } else {
                console.log('Nachricht nicht für aktuelle Lieferung oder falscher Typ');
            }
        } catch (error) {
            console.error('Fehler beim Verarbeiten der WebSocket Nachricht:', error);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket Fehler:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket Verbindung geschlossen');
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`Versuche in ${RECONNECT_DELAY/1000} Sekunden erneut zu verbinden (Versuch ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            setTimeout(connectWebSocket, RECONNECT_DELAY);
        } else {
            console.error('Maximale Anzahl an Verbindungsversuchen erreicht');
        }
    };
}

// Verbinde WebSocket
connectWebSocket();

// DOM Elemente
const trackingForm = document.getElementById('trackingForm');
const createDeliveryForm = document.getElementById('createDeliveryForm');
const deliveryDetails = document.getElementById('deliveryDetails');

// Tracking Form Handler
trackingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const trackingNumber = document.getElementById('trackingNumber').value;
    currentTrackingNumber = trackingNumber;

    try {
        const response = await fetch(`${API_URL}/deliveries/${trackingNumber}`);
        if (!response.ok) {
            throw new Error('Lieferung nicht gefunden');
        }

        const delivery = await response.json();
        displayDeliveryDetails(delivery);

        // Abonniere Updates für diese Lieferung
        subscribeToDelivery(trackingNumber);
    } catch (error) {
        alert(error.message);
    }
});

// Create Delivery Form Handler
createDeliveryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
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
        const response = await fetch(`${API_URL}/deliveries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(deliveryData)
        });

        if (!response.ok) {
            throw new Error('Fehler beim Erstellen der Lieferung');
        }

        const result = await response.json();
        alert(`Lieferung erstellt! Tracking-Nummer: ${result.trackingNumber}`);
        createDeliveryForm.reset();
    } catch (error) {
        alert(error.message);
    }
});

// Display Delivery Details
function displayDeliveryDetails(delivery) {
    // Show delivery details section
    deliveryDetails.style.display = 'block';

    // Update status
    document.getElementById('deliveryStatus').textContent = delivery.status;

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
    delivery.trackingHistory.forEach(event => {
        const li = document.createElement('li');
        li.textContent = `${new Date(event.timestamp).toLocaleString()} - ${event.status}: ${event.description}`;
        historyList.appendChild(li);
    });
}

// Funktion zum Abonnieren von Lieferungs-Updates
function subscribeToDelivery(trackingNumber) {
    console.log('Versuche Lieferung zu abonnieren:', trackingNumber);
    console.log('WebSocket Status:', ws ? ws.readyState : 'nicht verbunden');
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({
            type: 'subscribe',
            trackingNumber
        });
        console.log('Sende Subscribe Nachricht:', message);
        ws.send(message);
        console.log('Subscribe Nachricht gesendet');
    } else {
        console.warn('WebSocket nicht verbunden, kann nicht abonnieren');
    }
}

// Funktion zum Abbestellen von Lieferungs-Updates
function unsubscribeFromDelivery(trackingNumber) {
    console.log('Versuche Lieferung abzubestellen:', trackingNumber);
    console.log('WebSocket Status:', ws ? ws.readyState : 'nicht verbunden');
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({
            type: 'unsubscribe',
            trackingNumber
        });
        console.log('Sende Unsubscribe Nachricht:', message);
        ws.send(message);
        console.log('Unsubscribe Nachricht gesendet');
    } else {
        console.warn('WebSocket nicht verbunden, kann nicht abbestellen');
    }
}

// Status aktualisieren
document.getElementById('updateStatusBtn').addEventListener('click', async () => {
    const trackingNumber = document.getElementById('trackingNumber').value;
    const newStatus = document.getElementById('statusSelect').value;
    
    try {
        const response = await fetch(`${API_URL}/deliveries/${trackingNumber}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus,
                location: 'Aktuelle Position', // Standardwert
                description: `Status wurde zu ${newStatus} geändert` // Standardwert
            })
        });

        if (!response.ok) {
            throw new Error('Fehler beim Aktualisieren des Status');
        }

        const updatedDelivery = await response.json();
        displayDeliveryDetails(updatedDelivery);
    } catch (error) {
        alert(error.message);
    }
});

// Lieferung stornieren
document.getElementById('cancelDeliveryBtn').addEventListener('click', async () => {
    if (!confirm('Möchten Sie diese Lieferung wirklich stornieren?')) {
        return;
    }

    const trackingNumber = document.getElementById('trackingNumber').value;
    const reason = prompt('Bitte geben Sie den Grund für die Stornierung an:');
    
    if (!reason) {
        alert('Stornierung abgebrochen: Kein Grund angegeben');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/deliveries/${trackingNumber}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });

        if (!response.ok) {
            throw new Error('Fehler beim Stornieren der Lieferung');
        }

        const updatedDelivery = await response.json();
        displayDeliveryDetails(updatedDelivery);
    } catch (error) {
        alert(error.message);
    }
});

// Lieferung zurücksenden
document.getElementById('returnDeliveryBtn').addEventListener('click', async () => {
    if (!confirm('Möchten Sie diese Lieferung wirklich zurücksenden?')) {
        return;
    }

    const trackingNumber = document.getElementById('trackingNumber').value;
    const reason = prompt('Bitte geben Sie den Grund für die Rücksendung an:');
    
    if (!reason) {
        alert('Rücksendung abgebrochen: Kein Grund angegeben');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/deliveries/${trackingNumber}/return`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });

        if (!response.ok) {
            throw new Error('Fehler beim Zurücksenden der Lieferung');
        }

        const updatedDelivery = await response.json();
        displayDeliveryDetails(updatedDelivery);
    } catch (error) {
        alert(error.message);
    }
});

// Cleanup beim Verlassen der Seite
window.addEventListener('beforeunload', () => {
    if (currentTrackingNumber) {
        unsubscribeFromDelivery(currentTrackingNumber);
    }
    if (ws) {
        ws.close();
    }
}); 