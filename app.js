// Fakepixel Trading Hub v2.1 - Core Firebase Logic
// ================================================

// Firebase Configuration (Replace with your own config)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Super Admin Email (hardcoded for security)
const SUPER_ADMIN_EMAIL = "mahirsayban737@gmail.com";

// ==========================================
// AUTHENTICATION FUNCTIONS
// ==========================================

async function signInWithGoogle() {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        return result.user;
    } catch (error) {
        console.error("Sign-in error:", error);
        throw error;
    }
}

async function signOut() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error("Sign-out error:", error);
        throw error;
    }
}

// ==========================================
// ADMIN SYSTEM FUNCTIONS
// ==========================================

// Check if email is an admin (queries Firebase 'admins' node)
async function checkIsAdmin(email) {
    if (!email) return false;
    
    // Super admin always has access
    if (email === SUPER_ADMIN_EMAIL) return true;
    
    try {
        const snapshot = await database.ref('admins').once('value');
        const admins = snapshot.val();
        
        if (!admins) return false;
        
        // Check if email exists in admins list
        for (const key in admins) {
            if (admins[key].email === email && admins[key].active) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

// Add admin (only authorized users can use this)
async function addAdmin(email, addedBy) {
    if (!email || !addedBy) {
        throw new Error("Email and addedBy are required");
    }
    
    const isAuthorized = await checkIsAdmin(addedBy);
    if (!isAuthorized) {
        throw new Error("Unauthorized: Only admins can add other admins");
    }
    
    // Check if email already exists
    const snapshot = await database.ref('admins').orderByChild('email').equalTo(email).once('value');
    if (snapshot.exists()) {
        throw new Error("Admin already exists");
    }
    
    const newAdminRef = database.ref('admins').push();
    await newAdminRef.set({
        email: email,
        addedBy: addedBy,
        addedAt: firebase.database.ServerValue.TIMESTAMP,
        active: true
    });
    
    return newAdminRef.key;
}

// Remove admin (only authorized users can use this)
async function removeAdmin(email, removedBy) {
    if (!email || !removedBy) {
        throw new Error("Email and removedBy are required");
    }
    
    // Prevent removing super admin
    if (email === SUPER_ADMIN_EMAIL) {
        throw new Error("Cannot remove super admin");
    }
    
    const isAuthorized = await checkIsAdmin(removedBy);
    if (!isAuthorized) {
        throw new Error("Unauthorized: Only admins can remove other admins");
    }
    
    const snapshot = await database.ref('admins').orderByChild('email').equalTo(email).once('value');
    if (!snapshot.exists()) {
        throw new Error("Admin not found");
    }
    
    snapshot.forEach((childSnapshot) => {
        childSnapshot.ref.remove();
    });
    
    return true;
}

// Get all admins
async function getAllAdmins() {
    const snapshot = await database.ref('admins').once('value');
    const admins = [];
    
    // Always include super admin
    admins.push({ email: SUPER_ADMIN_EMAIL, isSuperAdmin: true });
    
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const admin = childSnapshot.val();
            admin.id = childSnapshot.key;
            admins.push(admin);
        });
    }
    
    return admins;
}

// ==========================================
// TRADE FUNCTIONS
// ==========================================

// Create a new trade
async function createTrade(tradeData, userId, userEmail, userName, userPhoto) {
    const tradeRef = database.ref('trades').push();
    const expiresAt = Date.now() + (48 * 60 * 60 * 1000); // 48 hours from now
    
    await tradeRef.set({
        ...tradeData,
        userId: userId,
        userEmail: userEmail,
        userName: userName,
        userPhoto: userPhoto || null,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        expiresAt: expiresAt,
        status: 'active'
    });
    
    return tradeRef.key;
}

// Get all active trades (real-time)
function subscribeToTrades(callback) {
    const tradesRef = database.ref('trades').orderByChild('status').equalTo('active');
    
    tradesRef.on('value', (snapshot) => {
        const trades = [];
        const now = Date.now();
        
        snapshot.forEach((childSnapshot) => {
            const trade = childSnapshot.val();
            trade.id = childSnapshot.key;
            
            // Check if trade has expired
            if (trade.expiresAt && trade.expiresAt < now) {
                // Mark as expired
                childSnapshot.ref.update({ status: 'expired' });
            } else {
                trades.push(trade);
            }
        });
        
        // Sort by newest first
        trades.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        callback(trades);
    });
    
    return () => tradesRef.off();
}

// Delete a trade
async function deleteTrade(tradeId, userId, userEmail) {
    const tradeRef = database.ref(`trades/${tradeId}`);
    const snapshot = await tradeRef.once('value');
    const trade = snapshot.val();
    
    if (!trade) {
        throw new Error("Trade not found");
    }
    
    // Check if user owns the trade or is admin
    const isAdmin = await checkIsAdmin(userEmail);
    if (trade.userId !== userId && !isAdmin) {
        throw new Error("Unauthorized: You can only delete your own trades");
    }
    
    await tradeRef.remove();
    return true;
}

// ==========================================
// ITEM FUNCTIONS
// ==========================================

// Get all items
async function getAllItems() {
    const snapshot = await database.ref('items').once('value');
    const items = [];
    
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const item = childSnapshot.val();
            item.id = childSnapshot.key;
            items.push(item);
        });
    }
    
    return items;
}

// Subscribe to items (real-time)
function subscribeToItems(callback) {
    const itemsRef = database.ref('items');
    
    itemsRef.on('value', (snapshot) => {
        const items = [];
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const item = childSnapshot.val();
                item.id = childSnapshot.key;
                items.push(item);
            });
        }
        
        // Sort alphabetically
        items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        callback(items);
    });
    
    return () => itemsRef.off();
}

// Add item (admin only)
async function addItem(itemData, userEmail) {
    const isAdmin = await checkIsAdmin(userEmail);
    if (!isAdmin) {
        throw new Error("Unauthorized: Only admins can add items");
    }
    
    const itemRef = database.ref('items').push();
    await itemRef.set({
        ...itemData,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        createdBy: userEmail
    });
    
    return itemRef.key;
}

// Update item (admin only)
async function updateItem(itemId, itemData, userEmail) {
    const isAdmin = await checkIsAdmin(userEmail);
    if (!isAdmin) {
        throw new Error("Unauthorized: Only admins can update items");
    }
    
    await database.ref(`items/${itemId}`).update({
        ...itemData,
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
        updatedBy: userEmail
    });
    
    return true;
}

// Delete item (admin only)
async function deleteItem(itemId, userEmail) {
    const isAdmin = await checkIsAdmin(userEmail);
    if (!isAdmin) {
        throw new Error("Unauthorized: Only admins can delete items");
    }
    
    await database.ref(`items/${itemId}`).remove();
    return true;
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// Calculate trade value
function calculateTradeValue(items, itemPrices) {
    let total = 0;
    
    for (const item of items) {
        const priceData = itemPrices.find(p => p.id === item.itemId);
        if (priceData) {
            total += (priceData.price || 0) * (item.quantity || 1);
        }
    }
    
    return total;
}

// Determine trade fairness
function determineTradeFairness(offeringValue, seekingValue) {
    if (offeringValue === 0 && seekingValue === 0) {
        return { result: 'Unknown', color: 'gray' };
    }
    
    const ratio = offeringValue / seekingValue;
    
    if (ratio >= 0.9 && ratio <= 1.1) {
        return { result: 'Fair', color: 'green', emoji: '⚖️' };
    } else if (ratio > 1.1) {
        return { result: 'Loss', color: 'red', emoji: '📉' };
    } else {
        return { result: 'Win', color: 'purple', emoji: '🎉' };
    }
}

// Format time remaining
function formatTimeRemaining(expiresAt) {
    const now = Date.now();
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

// Format price with commas
function formatPrice(price) {
    return new Intl.NumberFormat().format(price);
}

// Export functions for use in Vue apps
window.FakepixelHub = {
    // Auth
    auth,
    database,
    signInWithGoogle,
    signOut,
    
    // Admin
    checkIsAdmin,
    addAdmin,
    removeAdmin,
    getAllAdmins,
    SUPER_ADMIN_EMAIL,
    
    // Trades
    createTrade,
    subscribeToTrades,
    deleteTrade,
    
    // Items
    getAllItems,
    subscribeToItems,
    addItem,
    updateItem,
    deleteItem,
    
    // Utils
    calculateTradeValue,
    determineTradeFairness,
    formatTimeRemaining,
    formatPrice
};
