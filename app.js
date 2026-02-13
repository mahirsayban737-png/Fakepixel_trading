/* ========================================
   FAKEPIXEL TRADING HUB - CORE APPLICATION v3.0
   Firebase Auth (Redirect), Storage, Realtime Database
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
    cleanupExpiredTrades();
    
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
// AUTHENTICATION (Redirect Flow for Mobile)
// ========================================

// Google Sign-In with Redirect (Mobile Compatible)
async function signInWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
      'client_id': GOOGLE_CLIENT_ID
    });
    provider.addScope('profile');
    provider.addScope('email');
    
    // Use redirect for mobile compatibility
    await auth.signInWithRedirect(provider);
    return { success: true };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    return { success: false, error: error.message };
  }
}

// Handle Redirect Result (call on page load)
async function handleRedirectResult() {
  try {
    const result = await auth.getRedirectResult();
    if (result.user) {
      return {
        success: true,
        user: {
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL
        }
      };
    }
    return { success: true, user: null };
  } catch (error) {
    console.error('Redirect Result Error:', error);
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

// Upload Item Image to Firebase Storage
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
    
    // Create unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `items/${timestamp}_${sanitizedName}`;
    const storageRef = storage.ref(filename);
    
    // Upload file with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        'uploadedAt': new Date().toISOString()
      }
    };
    
    const snapshot = await storageRef.put(file, metadata);
    
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
// TRADES CRUD OPERATIONS (v3.0 Multi-Item + Limits)
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

// Create Trade Post (v3.0 - Multi-Item + Purse Support)
async function createTrade(tradeData) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'You must be signed in to post a trade.' };
    }
    
    // Check trade limit (max 5 per user)
    const canPost = await canUserPostTrade(user.uid);
    if (!canPost) {
      return { success: false, error: 'Trade limit reached! You can only have 5 active trades. Delete an existing trade first.' };
    }
    
    const timestamp = Date.now();
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
      timestamp: timestamp,
      createdAt: timestamp,
      expiresAt: timestamp + 604800000, // 7 days in milliseconds
      status: 'active'
    });
    
    return { success: true, id: newTradeRef.key };
  } catch (error) {
    console.error('Error creating trade:', error);
    return { success: false, error: error.message };
  }
}

// Delete Trade (only owner can delete, or admin with bypass)
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

// ========================================
// 7-DAY AUTO-EXPIRY CLEANUP
// ========================================

// Cleanup Expired Trades (trades older than 7 days = 604,800,000 ms)
async function cleanupExpiredTrades() {
  try {
    const SEVEN_DAYS_MS = 604800000;
    const cutoffTime = Date.now() - SEVEN_DAYS_MS;
    
    // Query trades older than 7 days
    const snapshot = await getTradesRef().orderByChild('timestamp').endAt(cutoffTime).once('value');
    
    const deletePromises = [];
    let deletedCount = 0;
    
    snapshot.forEach((childSnapshot) => {
      const trade = childSnapshot.val();
      // Double-check the timestamp
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

// Manual cleanup trigger (for admin use)
async function manualCleanup() {
  return await cleanupExpiredTrades();
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

// Listen to User's Trades Only
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

// Calculate days until expiry (7 days from creation)
function getDaysUntilExpiry(timestamp) {
  if (!timestamp) return 0;
  const SEVEN_DAYS_MS = 604800000;
  const expiryTime = timestamp + SEVEN_DAYS_MS;
  const remaining = expiryTime - Date.now();
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

// Check if trade is expiring soon (within 24 hours)
function isExpiringSoon(timestamp) {
  return getDaysUntilExpiry(timestamp) <= 1;
}

// Calculate trade fairness (v3.0 - Multi-Item + Purse)
function calculateTradeFairness(offeringItems, seekingItems, purseOffering, purseSeeking, allItems) {
  let offeringTotal = purseOffering || 0;
  let seekingTotal = purseSeeking || 0;
  
  // Calculate offering value
  if (offeringItems && Array.isArray(offeringItems)) {
    offeringItems.forEach(item => {
      const itemData = allItems.find(i => i.id === item.id);
      if (itemData && itemData.value) {
        offeringTotal += itemData.value * (item.quantity || 1);
      }
    });
  }
  
  // Calculate seeking value
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

// Get demand class for styling
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

// ========================================
// ADMIN AUTHENTICATION
// ========================================

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
// MINECRAFT ICONS DATA (Common Items)
// ========================================

const MINECRAFT_ICONS = [
  // Swords
  { name: 'diamond_sword', displayName: 'Diamond Sword', url: 'https://minecraft-api.vercel.app/images/items/diamond_sword.png' },
  { name: 'netherite_sword', displayName: 'Netherite Sword', url: 'https://minecraft-api.vercel.app/images/items/netherite_sword.png' },
  { name: 'iron_sword', displayName: 'Iron Sword', url: 'https://minecraft-api.vercel.app/images/items/iron_sword.png' },
  { name: 'golden_sword', displayName: 'Golden Sword', url: 'https://minecraft-api.vercel.app/images/items/golden_sword.png' },
  
  // Materials
  { name: 'diamond', displayName: 'Diamond', url: 'https://minecraft-api.vercel.app/images/items/diamond.png' },
  { name: 'emerald', displayName: 'Emerald', url: 'https://minecraft-api.vercel.app/images/items/emerald.png' },
  { name: 'netherite_ingot', displayName: 'Netherite Ingot', url: 'https://minecraft-api.vercel.app/images/items/netherite_ingot.png' },
  { name: 'gold_ingot', displayName: 'Gold Ingot', url: 'https://minecraft-api.vercel.app/images/items/gold_ingot.png' },
  { name: 'iron_ingot', displayName: 'Iron Ingot', url: 'https://minecraft-api.vercel.app/images/items/iron_ingot.png' },
  { name: 'ancient_debris', displayName: 'Ancient Debris', url: 'https://minecraft-api.vercel.app/images/blocks/ancient_debris_side.png' },
  { name: 'lapis_lazuli', displayName: 'Lapis Lazuli', url: 'https://minecraft-api.vercel.app/images/items/lapis_lazuli.png' },
  { name: 'redstone', displayName: 'Redstone', url: 'https://minecraft-api.vercel.app/images/items/redstone.png' },
  
  // Tools
  { name: 'diamond_pickaxe', displayName: 'Diamond Pickaxe', url: 'https://minecraft-api.vercel.app/images/items/diamond_pickaxe.png' },
  { name: 'netherite_pickaxe', displayName: 'Netherite Pickaxe', url: 'https://minecraft-api.vercel.app/images/items/netherite_pickaxe.png' },
  { name: 'diamond_axe', displayName: 'Diamond Axe', url: 'https://minecraft-api.vercel.app/images/items/diamond_axe.png' },
  { name: 'diamond_shovel', displayName: 'Diamond Shovel', url: 'https://minecraft-api.vercel.app/images/items/diamond_shovel.png' },
  { name: 'diamond_hoe', displayName: 'Diamond Hoe', url: 'https://minecraft-api.vercel.app/images/items/diamond_hoe.png' },
  
  // Armor
  { name: 'diamond_helmet', displayName: 'Diamond Helmet', url: 'https://minecraft-api.vercel.app/images/items/diamond_helmet.png' },
  { name: 'diamond_chestplate', displayName: 'Diamond Chestplate', url: 'https://minecraft-api.vercel.app/images/items/diamond_chestplate.png' },
  { name: 'diamond_leggings', displayName: 'Diamond Leggings', url: 'https://minecraft-api.vercel.app/images/items/diamond_leggings.png' },
  { name: 'diamond_boots', displayName: 'Diamond Boots', url: 'https://minecraft-api.vercel.app/images/items/diamond_boots.png' },
  { name: 'netherite_helmet', displayName: 'Netherite Helmet', url: 'https://minecraft-api.vercel.app/images/items/netherite_helmet.png' },
  { name: 'netherite_chestplate', displayName: 'Netherite Chestplate', url: 'https://minecraft-api.vercel.app/images/items/netherite_chestplate.png' },
  { name: 'netherite_leggings', displayName: 'Netherite Leggings', url: 'https://minecraft-api.vercel.app/images/items/netherite_leggings.png' },
  { name: 'netherite_boots', displayName: 'Netherite Boots', url: 'https://minecraft-api.vercel.app/images/items/netherite_boots.png' },
  
  // Special Items
  { name: 'enchanted_book', displayName: 'Enchanted Book', url: 'https://minecraft-api.vercel.app/images/items/enchanted_book.png' },
  { name: 'totem_of_undying', displayName: 'Totem of Undying', url: 'https://minecraft-api.vercel.app/images/items/totem_of_undying.png' },
  { name: 'elytra', displayName: 'Elytra', url: 'https://minecraft-api.vercel.app/images/items/elytra.png' },
  { name: 'trident', displayName: 'Trident', url: 'https://minecraft-api.vercel.app/images/items/trident.png' },
  { name: 'nether_star', displayName: 'Nether Star', url: 'https://minecraft-api.vercel.app/images/items/nether_star.png' },
  { name: 'beacon', displayName: 'Beacon', url: 'https://minecraft-api.vercel.app/images/blocks/beacon.png' },
  { name: 'dragon_egg', displayName: 'Dragon Egg', url: 'https://minecraft-api.vercel.app/images/blocks/dragon_egg.png' },
  { name: 'end_crystal', displayName: 'End Crystal', url: 'https://minecraft-api.vercel.app/images/items/end_crystal.png' },
  
  // Combat & Ranged
  { name: 'bow', displayName: 'Bow', url: 'https://minecraft-api.vercel.app/images/items/bow.png' },
  { name: 'crossbow', displayName: 'Crossbow', url: 'https://minecraft-api.vercel.app/images/items/crossbow.png' },
  { name: 'shield', displayName: 'Shield', url: 'https://minecraft-api.vercel.app/images/items/shield.png' },
  { name: 'arrow', displayName: 'Arrow', url: 'https://minecraft-api.vercel.app/images/items/arrow.png' },
  { name: 'spectral_arrow', displayName: 'Spectral Arrow', url: 'https://minecraft-api.vercel.app/images/items/spectral_arrow.png' },
  
  // Potions & Food
  { name: 'golden_apple', displayName: 'Golden Apple', url: 'https://minecraft-api.vercel.app/images/items/golden_apple.png' },
  { name: 'enchanted_golden_apple', displayName: 'Enchanted Golden Apple', url: 'https://minecraft-api.vercel.app/images/items/enchanted_golden_apple.png' },
  { name: 'potion', displayName: 'Potion', url: 'https://minecraft-api.vercel.app/images/items/potion.png' },
  { name: 'splash_potion', displayName: 'Splash Potion', url: 'https://minecraft-api.vercel.app/images/items/splash_potion.png' },
  
  // Rare Drops
  { name: 'ender_pearl', displayName: 'Ender Pearl', url: 'https://minecraft-api.vercel.app/images/items/ender_pearl.png' },
  { name: 'blaze_rod', displayName: 'Blaze Rod', url: 'https://minecraft-api.vercel.app/images/items/blaze_rod.png' },
  { name: 'ghast_tear', displayName: 'Ghast Tear', url: 'https://minecraft-api.vercel.app/images/items/ghast_tear.png' },
  { name: 'wither_skeleton_skull', displayName: 'Wither Skull', url: 'https://minecraft-api.vercel.app/images/items/wither_skeleton_skull.png' },
  { name: 'shulker_shell', displayName: 'Shulker Shell', url: 'https://minecraft-api.vercel.app/images/items/shulker_shell.png' },
  { name: 'heart_of_the_sea', displayName: 'Heart of the Sea', url: 'https://minecraft-api.vercel.app/images/items/heart_of_the_sea.png' },
  { name: 'nautilus_shell', displayName: 'Nautilus Shell', url: 'https://minecraft-api.vercel.app/images/items/nautilus_shell.png' },
  
  // Blocks
  { name: 'obsidian', displayName: 'Obsidian', url: 'https://minecraft-api.vercel.app/images/blocks/obsidian.png' },
  { name: 'crying_obsidian', displayName: 'Crying Obsidian', url: 'https://minecraft-api.vercel.app/images/blocks/crying_obsidian.png' },
  { name: 'respawn_anchor', displayName: 'Respawn Anchor', url: 'https://minecraft-api.vercel.app/images/blocks/respawn_anchor_top.png' },
  { name: 'lodestone', displayName: 'Lodestone', url: 'https://minecraft-api.vercel.app/images/blocks/lodestone_top.png' },
  { name: 'shulker_box', displayName: 'Shulker Box', url: 'https://minecraft-api.vercel.app/images/blocks/purple_shulker_box.png' },
  { name: 'ender_chest', displayName: 'Ender Chest', url: 'https://minecraft-api.vercel.app/images/blocks/ender_chest_front.png' },
  
  // Misc
  { name: 'name_tag', displayName: 'Name Tag', url: 'https://minecraft-api.vercel.app/images/items/name_tag.png' },
  { name: 'saddle', displayName: 'Saddle', url: 'https://minecraft-api.vercel.app/images/items/saddle.png' },
  { name: 'music_disc_pigstep', displayName: 'Music Disc (Pigstep)', url: 'https://minecraft-api.vercel.app/images/items/music_disc_pigstep.png' },
  { name: 'experience_bottle', displayName: 'Bottle o\' Enchanting', url: 'https://minecraft-api.vercel.app/images/items/experience_bottle.png' }
];

// Search Minecraft Icons
function searchMinecraftIcons(query) {
  if (!query) return [];
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
  // Firebase Init
  initFirebase,
  
  // Auth (Redirect Flow)
  signInWithGoogle,
  handleRedirectResult,
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
  canUserPostTrade,
  
  // Cleanup
  cleanupExpiredTrades,
  manualCleanup,
  
  // Subscriptions
  subscribeToItems,
  subscribeToTrades,
  subscribeToUserTrades,
  
  // Utilities
  formatNumber,
  formatRelativeTime,
  getDaysUntilExpiry,
  isExpiringSoon,
  calculateTradeFairness,
  getDemandClass,
  getTrendInfo,
  
  // Admin
  validateMasterKey,
  setAdminAuth,
  checkAdminAuth,
  clearAdminAuth,
  
  // Minecraft Icons
  MINECRAFT_ICONS,
  searchMinecraftIcons
};
