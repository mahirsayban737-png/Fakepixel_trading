/* ========================================
   FAKEPIXEL TRADING HUB - CORE APPLICATION v4.4
   Firebase Auth (BULLETPROOF REDIRECT FLOW), Storage, Real-time Database
   Profile System, Multi-Admin, Advanced Trading
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

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = "591274492072-f385mr5nvtnfu2pvr19idrkor7espehs.apps.googleusercontent.com";

// SUPER ADMIN - Hardcoded Owner
const SUPER_ADMIN_EMAIL = "mahirsayban737@gmail.com";

// Initialize Firebase
let app, database, auth, storage;

// AUTH STATE TRACKING - Critical for mobile
let authInitialized = false;
let redirectResultProcessed = false;
let pendingRedirectUser = null;

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
    
    // CRITICAL: Set persistence immediately after init
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(console.error);
    
    // Run auto cleanup on init
    cleanupExpiredTrades();
    
    return true;
  }
  return false;
}

// ========================================
// BULLETPROOF AUTH FLOW - MOBILE FIX v4.4
// ========================================

// Step 1: Sign in with redirect
async function signInWithGoogle() {
  try {
    // Set LOCAL persistence
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
      'client_id': GOOGLE_CLIENT_ID,
      'prompt': 'select_account'
    });
    provider.addScope('profile');
    provider.addScope('email');
    
    // Store a flag in sessionStorage to know we're expecting a redirect
    sessionStorage.setItem('pendingAuth', 'true');
    
    // Use redirect for mobile compatibility
    await auth.signInWithRedirect(provider);
  } catch (error) {
    console.error('Sign-in error:', error);
    sessionStorage.removeItem('pendingAuth');
    throw error;
  }
}

// Step 2: Check redirect result - MUST BE CALLED FIRST ON PAGE LOAD
async function checkRedirectResult() {
  if (redirectResultProcessed) {
    return pendingRedirectUser;
  }
  
  try {
    console.log('[Auth] Checking redirect result...');
    
    // Get the redirect result
    const result = await auth.getRedirectResult();
    redirectResultProcessed = true;
    sessionStorage.removeItem('pendingAuth');
    
    if (result && result.user) {
      console.log('[Auth] Redirect SUCCESS:', result.user.email);
      
      pendingRedirectUser = result.user;
      
      // Create profile if new user
      const existingProfile = await getUserProfile(result.user.uid);
      if (!existingProfile) {
        console.log('[Auth] Creating new profile...');
        await saveUserProfile(result.user.uid, {
          email: result.user.email,
          googleName: result.user.displayName,
          photoURL: result.user.photoURL,
          createdAt: firebase.database.ServerValue.TIMESTAMP
        });
      }
      
      return result.user;
    } else {
      console.log('[Auth] No redirect result');
      return null;
    }
  } catch (error) {
    console.error('[Auth] Redirect error:', error);
    redirectResultProcessed = true;
    sessionStorage.removeItem('pendingAuth');
    return null;
  }
}

// Step 3: Initialize auth and return user state
async function initializeAuth() {
  return new Promise(async (resolve) => {
    // First, check redirect result
    const redirectUser = await checkRedirectResult();
    
    if (redirectUser) {
      // User came from redirect, resolve with that user
      const fakepixelName = await getFakepixelUsername(redirectUser.uid);
      const profile = await getUserProfile(redirectUser.uid);
      
      resolve({
        uid: redirectUser.uid,
        displayName: redirectUser.displayName,
        email: redirectUser.email,
        photoURL: redirectUser.photoURL,
        fakepixelName: fakepixelName,
        needsProfile: !fakepixelName,
        profile: profile
      });
      return;
    }
    
    // No redirect user, check current auth state
    const currentUser = auth.currentUser;
    if (currentUser) {
      const fakepixelName = await getFakepixelUsername(currentUser.uid);
      const profile = await getUserProfile(currentUser.uid);
      
      resolve({
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        fakepixelName: fakepixelName,
        needsProfile: !fakepixelName,
        profile: profile
      });
      return;
    }
    
    // No user at all
    resolve(null);
  });
}

// Step 4: Subscribe to auth changes (for logout/login after initial load)
function onAuthStateChanged(callback) {
  let initialCallDone = false;
  
  return auth.onAuthStateChanged(async (user) => {
    // Skip the first call if we haven't processed redirect yet
    if (!redirectResultProcessed && !initialCallDone) {
      initialCallDone = true;
      // Wait for redirect result first
      const redirectUser = await checkRedirectResult();
      user = redirectUser || user;
    }
    
    if (user) {
      const fakepixelName = await getFakepixelUsername(user.uid);
      const profile = await getUserProfile(user.uid);
      
      const userData = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        fakepixelName: fakepixelName,
        needsProfile: !fakepixelName,
        profile: profile
      };
      
      callback(userData);
    } else {
      callback(null);
    }
    
    authInitialized = true;
  });
}

// Sign Out
async function signOut() {
  try {
    await auth.signOut();
    pendingRedirectUser = null;
    return { success: true };
  } catch (error) {
    console.error('Sign Out Error:', error);
    return { success: false, error: error.message };
  }
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

// Check if pending auth redirect
function isPendingAuth() {
  return sessionStorage.getItem('pendingAuth') === 'true';
}

// ========================================
// USER PROFILE SYSTEM
// ========================================

// Database References
function getUsersRef() {
  return database.ref('users');
}

function getItemsRef() {
  return database.ref('items');
}

function getTradesRef() {
  return database.ref('trades');
}

function getAdminsRef() {
  return database.ref('admins');
}

// Get User Profile
async function getUserProfile(uid) {
  try {
    const snapshot = await getUsersRef().child(uid).once('value');
    return snapshot.val();
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// Save/Update User Profile
async function saveUserProfile(uid, profileData) {
  try {
    await getUsersRef().child(uid).update({
      ...profileData,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving user profile:', error);
    return { success: false, error: error.message };
  }
}

// Set Fakepixel Username
async function setFakepixelUsername(uid, username) {
  try {
    if (!username || username.trim().length < 3) {
      return { success: false, error: 'Username must be at least 3 characters' };
    }
    
    if (username.trim().length > 16) {
      return { success: false, error: 'Username cannot exceed 16 characters' };
    }
    
    const validUsername = /^[a-zA-Z0-9_]+$/.test(username.trim());
    if (!validUsername) {
      return { success: false, error: 'Username can only contain letters, numbers, and underscores' };
    }
    
    await getUsersRef().child(uid).update({
      fakepixelName: username.trim(),
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error setting username:', error);
    return { success: false, error: error.message };
  }
}

// Get Fakepixel Username
async function getFakepixelUsername(uid) {
  try {
    const snapshot = await getUsersRef().child(uid).child('fakepixelName').once('value');
    return snapshot.val();
  } catch (error) {
    console.error('Error getting username:', error);
    return null;
  }
}

// Subscribe to User Profile Changes
function subscribeToUserProfile(uid, callback) {
  if (!database || !uid) return null;
  
  const userRef = getUsersRef().child(uid);
  userRef.on('value', (snapshot) => {
    callback(snapshot.val());
  });
  
  return () => userRef.off('value');
}

// ========================================
// MULTI-ADMIN PERMISSION SYSTEM
// ========================================

// Check if user is Super Admin (Hardcoded)
function isSuperAdmin(email) {
  return email === SUPER_ADMIN_EMAIL;
}

// Check if user is an Admin (Database check)
async function isAdmin(email) {
  if (!email) return false;
  
  // Super Admin always has access
  if (isSuperAdmin(email)) return true;
  
  try {
    const snapshot = await getAdminsRef().once('value');
    const admins = snapshot.val();
    
    if (!admins) return false;
    
    return Object.values(admins).some(admin => admin.email === email);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Subscribe to Admin Status Changes (Real-time)
function subscribeToAdminStatus(email, callback) {
  if (!database || !email) {
    callback(isSuperAdmin(email));
    return null;
  }
  
  if (isSuperAdmin(email)) {
    callback(true);
    return null;
  }
  
  const adminsRef = getAdminsRef();
  adminsRef.on('value', (snapshot) => {
    const admins = snapshot.val();
    if (!admins) {
      callback(false);
      return;
    }
    const isAdminUser = Object.values(admins).some(admin => admin.email === email);
    callback(isAdminUser);
  });
  
  return () => adminsRef.off('value');
}

// Add New Admin
async function addAdmin(email, addedBy) {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Invalid email format' };
    }
    
    if (isSuperAdmin(email)) {
      return { success: false, error: 'This user is already the Super Admin' };
    }
    
    const isAlreadyAdmin = await isAdmin(email);
    if (isAlreadyAdmin) {
      return { success: false, error: 'This user is already an admin' };
    }
    
    const newAdminRef = getAdminsRef().push();
    await newAdminRef.set({
      email: email.toLowerCase().trim(),
      addedBy: addedBy,
      addedAt: firebase.database.ServerValue.TIMESTAMP
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error adding admin:', error);
    return { success: false, error: error.message };
  }
}

// Remove Admin
async function removeAdmin(adminId) {
  try {
    await getAdminsRef().child(adminId).remove();
    return { success: true };
  } catch (error) {
    console.error('Error removing admin:', error);
    return { success: false, error: error.message };
  }
}

// Get All Admins
function subscribeToAdmins(callback) {
  if (!database) return null;
  
  const adminsRef = getAdminsRef();
  adminsRef.on('value', (snapshot) => {
    const admins = [];
    snapshot.forEach((childSnapshot) => {
      admins.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    callback(admins);
  });
  
  return () => adminsRef.off('value');
}

// ========================================
// FIREBASE STORAGE - DIRECT UPLOAD FIX
// ========================================

// Upload Item Image to Firebase Storage - FIXED FOR MOBILE
async function uploadItemImage(file) {
  if (!file) {
    return { success: false, error: 'No file provided' };
  }
  
  // Validate file type
  const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { success: false, error: 'Invalid file type. Use PNG, JPEG, GIF, or WebP.' };
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'File too large. Maximum size is 5MB.' };
  }
  
  // Create unique filename
  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const filename = `items/${timestamp}_${cleanName}`;
  
  try {
    // Get storage reference
    const storageRef = storage.ref(filename);
    
    // Direct upload using put() - works on mobile
    const snapshot = await storageRef.put(file);
    
    // Get download URL
    const downloadURL = await snapshot.ref.getDownloadURL();
    
    console.log('Upload successful:', downloadURL);
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Upload error:', error);
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
// TRADES CRUD OPERATIONS
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

// Check if user can post more trades (limit: 5)
async function canUserPostTrade(uid) {
  const count = await countUserTrades(uid);
  return count < 5;
}

// Validate Trade Data - MUST have items OR purse in BOTH sides
function validateTradeData(tradeData) {
  const hasOfferingItems = tradeData.offering && tradeData.offering.length > 0;
  const hasOfferingPurse = tradeData.purseOffering && tradeData.purseOffering > 0;
  const hasSeekingItems = tradeData.seeking && tradeData.seeking.length > 0;
  const hasSeekingPurse = tradeData.purseSeeking && tradeData.purseSeeking > 0;
  
  const hasOffering = hasOfferingItems || hasOfferingPurse;
  const hasSeeking = hasSeekingItems || hasSeekingPurse;
  
  if (!hasOffering) {
    return { valid: false, error: 'You must offer at least 1 item or Purse value.' };
  }
  
  if (!hasSeeking) {
    return { valid: false, error: 'You must want at least 1 item or Purse value.' };
  }
  
  return { valid: true };
}

// Create Trade Post
async function createTrade(tradeData, fakepixelName) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'You must be signed in to post a trade.' };
    }
    
    // Check trade limit
    const canPost = await canUserPostTrade(user.uid);
    if (!canPost) {
      return { success: false, error: 'Trade limit reached! You can only have 5 active trades.' };
    }
    
    // Validate trade data
    const validation = validateTradeData(tradeData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const timestamp = Date.now();
    const newTradeRef = getTradesRef().push();
    
    await newTradeRef.set({
      ...tradeData,
      uid: user.uid,
      username: fakepixelName || user.displayName || 'Anonymous',
      userPhoto: user.photoURL || '',
      userEmail: user.email || '',
      offering: tradeData.offering || [],
      seeking: tradeData.seeking || [],
      purseOffering: tradeData.purseOffering || 0,
      purseSeeking: tradeData.purseSeeking || 0,
      timestamp: timestamp,
      createdAt: timestamp,
      expiresAt: timestamp + 604800000, // 7 days
      status: 'active'
    });
    
    return { success: true, id: newTradeRef.key };
  } catch (error) {
    console.error('Error creating trade:', error);
    return { success: false, error: error.message };
  }
}

// Delete Trade
async function deleteTrade(tradeId, checkOwnership = true) {
  try {
    if (checkOwnership) {
      const user = getCurrentUser();
      if (!user) {
        return { success: false, error: 'You must be signed in.' };
      }
      
      const tradeSnap = await getTradesRef().child(tradeId).once('value');
      const trade = tradeSnap.val();
      if (trade && trade.uid !== user.uid) {
        const adminStatus = await isAdmin(user.email);
        if (!adminStatus) {
          return { success: false, error: 'You can only delete your own trades.' };
        }
      }
    }
    
    await getTradesRef().child(tradeId).remove();
    return { success: true };
  } catch (error) {
    console.error('Error deleting trade:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// 7-DAY AUTO-EXPIRY CLEANUP
// ========================================

async function cleanupExpiredTrades() {
  try {
    const SEVEN_DAYS_MS = 604800000;
    const cutoffTime = Date.now() - SEVEN_DAYS_MS;
    
    const snapshot = await getTradesRef().orderByChild('timestamp').endAt(cutoffTime).once('value');
    
    const deletePromises = [];
    let deletedCount = 0;
    
    snapshot.forEach((childSnapshot) => {
      const trade = childSnapshot.val();
      if (trade.timestamp && trade.timestamp < cutoffTime) {
        deletePromises.push(childSnapshot.ref.remove());
        deletedCount++;
      }
    });
    
    await Promise.all(deletePromises);
    
    if (deletedCount > 0) {
      console.log(`Auto cleanup: Removed ${deletedCount} expired trades.`);
    }
    
    return { success: true, count: deletedCount };
  } catch (error) {
    console.error('Auto cleanup error:', error);
    return { success: false, error: error.message };
  }
}

async function manualCleanup() {
  return await cleanupExpiredTrades();
}

// ========================================
// REAL-TIME LISTENERS
// ========================================

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
    callback(trades.reverse());
  }, (error) => {
    console.error('Trades listener error:', error);
    callback([]);
  });
  
  return () => tradesRef.off('value');
}

function subscribeToUserTrades(uid, callback) {
  if (!database || !uid) return null;
  
  const tradesRef = getTradesRef().orderByChild('uid').equalTo(uid);
  tradesRef.on('value', (snapshot) => {
    const trades = [];
    snapshot.forEach((childSnapshot) => {
      trades.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    callback(trades);
  }, (error) => {
    console.error('User trades listener error:', error);
    callback([]);
  });
  
  return () => tradesRef.off('value');
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

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

function getDaysUntilExpiry(timestamp) {
  if (!timestamp) return 0;
  const SEVEN_DAYS_MS = 604800000;
  const expiryTime = timestamp + SEVEN_DAYS_MS;
  const remaining = expiryTime - Date.now();
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

function isExpiringSoon(timestamp) {
  return getDaysUntilExpiry(timestamp) <= 1;
}

function calculateTradeFairness(offeringItems, seekingItems, purseOffering, purseSeeking, allItems) {
  let offeringTotal = purseOffering || 0;
  let seekingTotal = purseSeeking || 0;
  
  if (offeringItems && Array.isArray(offeringItems)) {
    offeringItems.forEach(item => {
      const itemData = allItems.find(i => i.id === item.id);
      if (itemData && itemData.value) {
        offeringTotal += itemData.value * (item.quantity || 1);
      }
    });
  }
  
  if (seekingItems && Array.isArray(seekingItems)) {
    seekingItems.forEach(item => {
      const itemData = allItems.find(i => i.id === item.id);
      if (itemData && itemData.value) {
        seekingTotal += itemData.value * (item.quantity || 1);
      }
    });
  }
  
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

function getDemandClass(demand) {
  switch (demand?.toLowerCase()) {
    case 'high': return 'demand-high';
    case 'medium': return 'demand-medium';
    case 'low': return 'demand-low';
    default: return 'demand-medium';
  }
}

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

// ========================================
// MINECRAFT ICONS DATA
// ========================================

const MINECRAFT_ICONS = [
  { name: 'diamond_sword', displayName: 'Diamond Sword', url: 'https://minecraft-api.vercel.app/images/items/diamond_sword.png' },
  { name: 'netherite_sword', displayName: 'Netherite Sword', url: 'https://minecraft-api.vercel.app/images/items/netherite_sword.png' },
  { name: 'iron_sword', displayName: 'Iron Sword', url: 'https://minecraft-api.vercel.app/images/items/iron_sword.png' },
  { name: 'diamond', displayName: 'Diamond', url: 'https://minecraft-api.vercel.app/images/items/diamond.png' },
  { name: 'emerald', displayName: 'Emerald', url: 'https://minecraft-api.vercel.app/images/items/emerald.png' },
  { name: 'netherite_ingot', displayName: 'Netherite Ingot', url: 'https://minecraft-api.vercel.app/images/items/netherite_ingot.png' },
  { name: 'gold_ingot', displayName: 'Gold Ingot', url: 'https://minecraft-api.vercel.app/images/items/gold_ingot.png' },
  { name: 'iron_ingot', displayName: 'Iron Ingot', url: 'https://minecraft-api.vercel.app/images/items/iron_ingot.png' },
  { name: 'diamond_pickaxe', displayName: 'Diamond Pickaxe', url: 'https://minecraft-api.vercel.app/images/items/diamond_pickaxe.png' },
  { name: 'netherite_pickaxe', displayName: 'Netherite Pickaxe', url: 'https://minecraft-api.vercel.app/images/items/netherite_pickaxe.png' },
  { name: 'diamond_helmet', displayName: 'Diamond Helmet', url: 'https://minecraft-api.vercel.app/images/items/diamond_helmet.png' },
  { name: 'diamond_chestplate', displayName: 'Diamond Chestplate', url: 'https://minecraft-api.vercel.app/images/items/diamond_chestplate.png' },
  { name: 'diamond_leggings', displayName: 'Diamond Leggings', url: 'https://minecraft-api.vercel.app/images/items/diamond_leggings.png' },
  { name: 'diamond_boots', displayName: 'Diamond Boots', url: 'https://minecraft-api.vercel.app/images/items/diamond_boots.png' },
  { name: 'netherite_helmet', displayName: 'Netherite Helmet', url: 'https://minecraft-api.vercel.app/images/items/netherite_helmet.png' },
  { name: 'netherite_chestplate', displayName: 'Netherite Chestplate', url: 'https://minecraft-api.vercel.app/images/items/netherite_chestplate.png' },
  { name: 'netherite_leggings', displayName: 'Netherite Leggings', url: 'https://minecraft-api.vercel.app/images/items/netherite_leggings.png' },
  { name: 'netherite_boots', displayName: 'Netherite Boots', url: 'https://minecraft-api.vercel.app/images/items/netherite_boots.png' },
  { name: 'enchanted_book', displayName: 'Enchanted Book', url: 'https://minecraft-api.vercel.app/images/items/enchanted_book.png' },
  { name: 'totem_of_undying', displayName: 'Totem of Undying', url: 'https://minecraft-api.vercel.app/images/items/totem_of_undying.png' },
  { name: 'elytra', displayName: 'Elytra', url: 'https://minecraft-api.vercel.app/images/items/elytra.png' },
  { name: 'trident', displayName: 'Trident', url: 'https://minecraft-api.vercel.app/images/items/trident.png' },
  { name: 'nether_star', displayName: 'Nether Star', url: 'https://minecraft-api.vercel.app/images/items/nether_star.png' },
  { name: 'beacon', displayName: 'Beacon', url: 'https://minecraft-api.vercel.app/images/blocks/beacon.png' },
  { name: 'dragon_egg', displayName: 'Dragon Egg', url: 'https://minecraft-api.vercel.app/images/blocks/dragon_egg.png' },
  { name: 'golden_apple', displayName: 'Golden Apple', url: 'https://minecraft-api.vercel.app/images/items/golden_apple.png' },
  { name: 'enchanted_golden_apple', displayName: 'Enchanted Golden Apple', url: 'https://minecraft-api.vercel.app/images/items/enchanted_golden_apple.png' },
  { name: 'ender_pearl', displayName: 'Ender Pearl', url: 'https://minecraft-api.vercel.app/images/items/ender_pearl.png' },
  { name: 'blaze_rod', displayName: 'Blaze Rod', url: 'https://minecraft-api.vercel.app/images/items/blaze_rod.png' },
  { name: 'ghast_tear', displayName: 'Ghast Tear', url: 'https://minecraft-api.vercel.app/images/items/ghast_tear.png' },
  { name: 'wither_skeleton_skull', displayName: 'Wither Skull', url: 'https://minecraft-api.vercel.app/images/items/wither_skeleton_skull.png' },
  { name: 'shulker_shell', displayName: 'Shulker Shell', url: 'https://minecraft-api.vercel.app/images/items/shulker_shell.png' },
  { name: 'heart_of_the_sea', displayName: 'Heart of the Sea', url: 'https://minecraft-api.vercel.app/images/items/heart_of_the_sea.png' },
  { name: 'bow', displayName: 'Bow', url: 'https://minecraft-api.vercel.app/images/items/bow.png' },
  { name: 'crossbow', displayName: 'Crossbow', url: 'https://minecraft-api.vercel.app/images/items/crossbow.png' },
  { name: 'shield', displayName: 'Shield', url: 'https://minecraft-api.vercel.app/images/items/shield.png' },
  { name: 'fishing_rod', displayName: 'Fishing Rod', url: 'https://minecraft-api.vercel.app/images/items/fishing_rod.png' },
  { name: 'name_tag', displayName: 'Name Tag', url: 'https://minecraft-api.vercel.app/images/items/name_tag.png' },
  { name: 'saddle', displayName: 'Saddle', url: 'https://minecraft-api.vercel.app/images/items/saddle.png' },
  { name: 'experience_bottle', displayName: 'Bottle o\' Enchanting', url: 'https://minecraft-api.vercel.app/images/items/experience_bottle.png' }
];

function searchMinecraftIcons(query) {
  if (!query) return MINECRAFT_ICONS.slice(0, 20);
  const lowerQuery = query.toLowerCase();
  return MINECRAFT_ICONS.filter(icon => 
    icon.name.includes(lowerQuery) || 
    icon.displayName.toLowerCase().includes(lowerQuery)
  );
}

// ========================================
// EXPORT FOR USE IN VUE APPS
// ========================================

window.FakepixelHub = {
  initFirebase,
  signInWithGoogle,
  checkRedirectResult,
  initializeAuth,
  isPendingAuth,
  signOut,
  onAuthStateChanged,
  getCurrentUser,
  getUserProfile,
  saveUserProfile,
  setFakepixelUsername,
  getFakepixelUsername,
  subscribeToUserProfile,
  SUPER_ADMIN_EMAIL,
  isSuperAdmin,
  isAdmin,
  subscribeToAdminStatus,
  addAdmin,
  removeAdmin,
  subscribeToAdmins,
  uploadItemImage,
  createItem,
  updateItem,
  deleteItem,
  createTrade,
  deleteTrade,
  countUserTrades,
  canUserPostTrade,
  validateTradeData,
  cleanupExpiredTrades,
  manualCleanup,
  subscribeToItems,
  subscribeToTrades,
  subscribeToUserTrades,
  formatNumber,
  formatRelativeTime,
  getDaysUntilExpiry,
  isExpiringSoon,
  calculateTradeFairness,
  getDemandClass,
  getTrendInfo,
  MINECRAFT_ICONS,
  searchMinecraftIcons
};
