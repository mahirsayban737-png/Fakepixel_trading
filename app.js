/* ========================================
   FAKEPIXEL TRADING HUB - CORE APPLICATION v2.0
   Firebase Auth, Storage, Real-time Database
   ======================================== */

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDLGg2jdIfXK0ntW67noXMegboT-0qOewM",
  authDomain: "fakepixel-trading.firebaseapp.com",
  databaseURL: "https://fakepixel-trading-default-rtdb.firebaseio.com",
  projectId: "fakepixel-trading",
  storageBucket: "fakepixel-trading.firebasestorage.app",
  messagingSenderId: "591274492072",
  appId: "1:591274492072:web:eceecf2b8b51026c41429d"
};

// Initialize Firebase
let app, database, auth, storage;

function initFirebase() {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      app = firebase.initializeApp(firebaseConfig);
    } else {
      app = firebase.apps[0];
    }
    database = firebase.database();
    auth = firebase.auth();
    storage = firebase.storage();
    
    // Run auto cleanup on init
    autoCleanup();
    
    return true;
  }
  return false;
}

// Database References
function getItemsRef() {
  return database.ref('items');
}

function getTradesRef() {
  return database.ref('trades');
}

function getUserTradesRef(uid) {
  return database.ref('userTrades').child(uid);
}

// ========================================
// AUTHENTICATION
// ========================================

// Google Sign-In
async function signInWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    const result = await auth.signInWithPopup(provider);
    return {
      success: true,
      user: {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL
      }
    };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    return { success: false, error: error.message };
  }
}

// Sign Out
async function signOut() {
  try {
    await auth.signOut();
    return { success: true };
  } catch (error) {
    console.error('Sign Out Error:', error);
    return { success: false, error: error.message };
  }
}

// Auth State Listener
function onAuthStateChanged(callback) {
  return auth.onAuthStateChanged((user) => {
    if (user) {
      callback({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      });
    } else {
      callback(null);
    }
  });
}

// Get Current User
function getCurrentUser() {
  const user = auth.currentUser;
  if (user) {
    return {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL
    };
  }
  return null;
}

// ========================================
// FIREBASE STORAGE
// ========================================

// Upload Item Image
async function uploadItemImage(file) {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }
    
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Please upload PNG, JPEG, GIF, or WebP.' };
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File too large. Maximum size is 5MB.' };
    }
    
    // Create unique filename
    const timestamp = Date.now();
    const filename = `items/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = storage.ref(filename);
    
    // Upload file
    const snapshot = await storageRef.put(file);
    
    // Get download URL
    const downloadURL = await snapshot.ref.getDownloadURL();
    
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Upload Error:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// ITEMS CRUD OPERATIONS
// ========================================

// Create Item
async function createItem(itemData) {
  try {
    const newItemRef = getItemsRef().push();
    await newItemRef.set({
      ...itemData,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
    return { success: true, id: newItemRef.key };
  } catch (error) {
    console.error('Error creating item:', error);
    return { success: false, error: error.message };
  }
}

// Update Item
async function updateItem(itemId, itemData) {
  try {
    await getItemsRef().child(itemId).update({
      ...itemData,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating item:', error);
    return { success: false, error: error.message };
  }
}

// Delete Item
async function deleteItem(itemId) {
  try {
    await getItemsRef().child(itemId).remove();
    return { success: true };
  } catch (error) {
    console.error('Error deleting item:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// TRADES CRUD OPERATIONS (v2.0 Multi-Item)
// ========================================

// Count User Trades
async function countUserTrades(uid) {
  try {
    const snapshot = await getTradesRef().orderByChild('uid').equalTo(uid).once('value');
    return snapshot.numChildren();
  } catch (error) {
    console.error('Error counting trades:', error);
    return 0;
  }
}

// Create Trade Post (v2.0 - Multi-Item Support)
async function createTrade(tradeData) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'You must be signed in to post a trade.' };
    }
    
    // Check trade limit (max 5 per user)
    const tradeCount = await countUserTrades(user.uid);
    if (tradeCount >= 5) {
      return { success: false, error: 'Trade limit reached! You can only have 5 active trades. Delete an existing trade first.' };
    }
    
    const newTradeRef = getTradesRef().push();
    await newTradeRef.set({
      ...tradeData,
      uid: user.uid,
      username: user.displayName || 'Anonymous',
      userPhoto: user.photoURL || '',
      userEmail: user.email || '',
      // Multi-item arrays
      offering: tradeData.offering || [],
      seeking: tradeData.seeking || [],
      // Purse (coins)
      purseOffering: tradeData.purseOffering || 0,
      purseSeeking: tradeData.purseSeeking || 0,
      // Timestamps
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      status: 'active'
    });
    
    return { success: true, id: newTradeRef.key };
  } catch (error) {
    console.error('Error creating trade:', error);
    return { success: false, error: error.message };
  }
}

// Delete Trade (only owner can delete)
async function deleteTrade(tradeId, checkOwnership = true) {
  try {
    if (checkOwnership) {
      const user = getCurrentUser();
      if (!user) {
        return { success: false, error: 'You must be signed in.' };
      }
      
      // Check ownership
      const tradeSnap = await getTradesRef().child(tradeId).once('value');
      const trade = tradeSnap.val();
      if (trade && trade.uid !== user.uid) {
        return { success: false, error: 'You can only delete your own trades.' };
      }
    }
    
    await getTradesRef().child(tradeId).remove();
    return { success: true };
  } catch (error) {
    console.error('Error deleting trade:', error);
    return { success: false, error: error.message };
  }
}

// Auto Cleanup - Delete trades older than 7 days
async function autoCleanup() {
  try {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const snapshot = await getTradesRef().orderByChild('timestamp').endAt(sevenDaysAgo).once('value');
    
    const deletePromises = [];
    snapshot.forEach((childSnapshot) => {
      deletePromises.push(childSnapshot.ref.remove());
    });
    
    await Promise.all(deletePromises);
    console.log(`Auto cleanup: Removed ${deletePromises.length} expired trades.`);
    return { success: true, count: deletePromises.length };
  } catch (error) {
    console.error('Auto cleanup error:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// REAL-TIME LISTENERS
// ========================================

// Listen to Items
function subscribeToItems(callback) {
  if (!database) return null;
  
  const itemsRef = getItemsRef();
  itemsRef.on('value', (snapshot) => {
    const items = [];
    snapshot.forEach((childSnapshot) => {
      items.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    callback(items);
  }, (error) => {
    console.error('Items listener error:', error);
    callback([]);
  });
  
  return () => itemsRef.off('value');
}

// Listen to Trades
function subscribeToTrades(callback) {
  if (!database) return null;
  
  const tradesRef = getTradesRef().orderByChild('timestamp').limitToLast(100);
  tradesRef.on('value', (snapshot) => {
    const trades = [];
    snapshot.forEach((childSnapshot) => {
      trades.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    // Reverse to show newest first
    callback(trades.reverse());
  }, (error) => {
    console.error('Trades listener error:', error);
    callback([]);
  });
  
  return () => tradesRef.off('value');
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Format number with commas
function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format relative time
function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Unknown';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

// Calculate days until expiry
function getDaysUntilExpiry(timestamp) {
  if (!timestamp) return 0;
  const expiryTime = timestamp + (7 * 24 * 60 * 60 * 1000);
  const remaining = expiryTime - Date.now();
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

// Calculate trade fairness (v2.0 - Multi-Item)
function calculateTradeFairness(offeringItems, seekingItems, purseOffering, purseSeeking, allItems) {
  let offeringTotal = purseOffering || 0;
  let seekingTotal = purseSeeking || 0;
  
  offeringItems.forEach(item => {
    const itemData = allItems.find(i => i.id === item.id);
    if (itemData && itemData.value) {
      offeringTotal += itemData.value * (item.quantity || 1);
    }
  });
  
  seekingItems.forEach(item => {
    const itemData = allItems.find(i => i.id === item.id);
    if (itemData && itemData.value) {
      seekingTotal += itemData.value * (item.quantity || 1);
    }
  });
  
  if (offeringTotal === 0 && seekingTotal === 0) {
    return { verdict: 'unknown', percentage: 50, difference: 0 };
  }
  
  const total = offeringTotal + seekingTotal;
  const difference = seekingTotal - offeringTotal;
  const percentageDiff = total > 0 ? (difference / total) * 100 : 0;
  
  let verdict;
  if (Math.abs(percentageDiff) <= 5) {
    verdict = 'fair';
  } else if (percentageDiff > 5) {
    verdict = 'win';
  } else {
    verdict = 'loss';
  }
  
  return {
    verdict,
    percentage: Math.min(100, Math.max(0, 50 + (percentageDiff / 2))),
    offeringTotal,
    seekingTotal,
    difference: Math.abs(difference)
  };
}

// Get demand class
function getDemandClass(demand) {
  switch (demand?.toLowerCase()) {
    case 'high': return 'demand-high';
    case 'medium': return 'demand-medium';
    case 'low': return 'demand-low';
    default: return 'demand-medium';
  }
}

// Get trend icon and class
function getTrendInfo(trend) {
  switch (trend?.toLowerCase()) {
    case 'up':
      return { icon: 'trending-up', class: 'trend-up', text: 'Rising' };
    case 'down':
      return { icon: 'trending-down', class: 'trend-down', text: 'Falling' };
    default:
      return { icon: 'minus', class: 'trend-stable', text: 'Stable' };
  }
}

// Admin Authentication
const MASTER_KEY = 'FakepixelAdmin2024';

function validateMasterKey(key) {
  return key === MASTER_KEY;
}

// Session Storage for Admin Auth
function setAdminAuth(isAuth) {
  sessionStorage.setItem('adminAuth', isAuth ? 'true' : 'false');
}

function checkAdminAuth() {
  return sessionStorage.getItem('adminAuth') === 'true';
}

function clearAdminAuth() {
  sessionStorage.removeItem('adminAuth');
}

// ========================================
// EXPORT FOR USE IN VUE APPS
// ========================================

window.FakepixelHub = {
  // Firebase Init
  initFirebase,
  
  // Auth
  signInWithGoogle,
  signOut,
  onAuthStateChanged,
  getCurrentUser,
  
  // Storage
  uploadItemImage,
  
  // Items CRUD
  createItem,
  updateItem,
  deleteItem,
  
  // Trades CRUD
  createTrade,
  deleteTrade,
  countUserTrades,
  autoCleanup,
  
  // Subscriptions
  subscribeToItems,
  subscribeToTrades,
  
  // Utilities
  formatNumber,
  formatRelativeTime,
  getDaysUntilExpiry,
  calculateTradeFairness,
  getDemandClass,
  getTrendInfo,
  
  // Admin
  validateMasterKey,
  setAdminAuth,
  checkAdminAuth,
  clearAdminAuth
};
