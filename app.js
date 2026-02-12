// ================================================================
//  FAKEPIXEL TRADING HUB — Core Engine (app.js)
//  Firebase Compat v9 · Redirect Auth · Realtime Database · Storage
// ================================================================

// ─── FIREBASE CONFIGURATION ─────────────────────────────────────
// ⚠️  REPLACE every value below with your real Firebase project config
// ─── Found in: Firebase Console → Project Settings → General ────
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  databaseURL:       "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const auth    = firebase.auth();
const db      = firebase.database();
const storage = firebase.storage();

// ─── CONSTANTS ──────────────────────────────────────────────────
const SUPER_ADMIN_EMAIL = "mahirsayban737@gmail.com";

// ================================================================
//  1. AUTHENTICATION ENGINE  (fixes Samsung S24 FE redirect loop)
// ================================================================

/**
 * MUST be awaited before the Vue app sets authLoading = false.
 * Sets LOCAL persistence (indexedDB) → survives Chrome restarts.
 * Then resolves the pending redirect result so the session sticks.
 */
async function handleAuthCallback() {
  try {
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    const result = await auth.getRedirectResult();
    if (result && result.user) {
      console.log("[Auth] Redirect resolved for:", result.user.email);
      await syncUserProfile(result.user);
    }
    return result;
  } catch (err) {
    // credential-already-in-use, popup-blocked, etc. — don't crash the app
    console.warn("[Auth] getRedirectResult error:", err.code, err.message);
    return null;
  }
}

/**
 * Kicks off the Google redirect sign-in flow.
 */
async function signInWithGoogle() {
  try {
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await auth.signInWithRedirect(provider);
  } catch (err) {
    console.error("[Auth] signInWithRedirect error:", err);
    throw err;
  }
}

function signOutUser() {
  return auth.signOut();
}

// ================================================================
//  2. USER PROFILE
// ================================================================

async function syncUserProfile(user) {
  if (!user) return null;
  const ref = db.ref("users/" + user.uid);
  const snap = await ref.once("value");
  const existing = snap.val();
  await ref.update({
    email:       user.email,
    displayName: user.displayName || "",
    photoURL:    user.photoURL || "",
    lastLogin:   firebase.database.ServerValue.TIMESTAMP
  });
  return existing;
}

async function getUserProfile(uid) {
  const snap = await db.ref("users/" + uid).once("value");
  return snap.val();
}

async function setFakepixelName(uid, name) {
  await db.ref("users/" + uid).update({ fakepixelName: name });
}

// ================================================================
//  3. PERMISSIONS ENGINE
// ================================================================

async function checkIsAdmin(email) {
  if (!email) return false;
  if (email === SUPER_ADMIN_EMAIL) return true;
  try {
    const snap = await db.ref("admins").once("value");
    const data = snap.val();
    if (!data) return false;
    return Object.values(data).some(function (e) { return e === email; });
  } catch (err) {
    console.error("[Permissions]", err);
    return false;
  }
}

async function addAdmin(email) {
  if (!email || !email.includes("@")) throw new Error("Invalid email address.");
  // Prevent duplicates
  const snap = await db.ref("admins").once("value");
  const data = snap.val() || {};
  if (Object.values(data).includes(email)) throw new Error("Already an admin.");
  await db.ref("admins").push(email);
}

async function removeAdmin(key) {
  await db.ref("admins/" + key).remove();
}

async function fetchAdmins() {
  const snap = await db.ref("admins").once("value");
  return snap.val() || {};
}

// ================================================================
//  4. ITEMS ENGINE
// ================================================================

async function fetchItems() {
  const snap = await db.ref("items").once("value");
  const data = snap.val() || {};
  return Object.entries(data).map(function (pair) {
    return Object.assign({ id: pair[0] }, pair[1]);
  });
}

/**
 * Uploads an image file to Firebase Storage, then saves the item
 * with the permanent download URL to the Realtime Database.
 */
async function addItem(name, category, rarity, file, onProgress) {
  var storageRef = storage.ref("items/" + Date.now() + "_" + file.name);
  var task = storageRef.put(file);

  return new Promise(function (resolve, reject) {
    task.on("state_changed",
      function (snapshot) {
        var pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(pct);
      },
      function (err) { reject(err); },
      async function () {
        try {
          var imageUrl = await task.snapshot.ref.getDownloadURL();
          var itemRef = db.ref("items").push();
          await itemRef.set({
            name:      name,
            category:  category || "General",
            rarity:    rarity || "Common",
            imageUrl:  imageUrl,
            createdAt: firebase.database.ServerValue.TIMESTAMP
          });
          resolve(itemRef.key);
        } catch (e) { reject(e); }
      }
    );
  });
}

async function updateItem(itemId, updates) {
  await db.ref("items/" + itemId).update(updates);
}

async function deleteItem(itemId) {
  await db.ref("items/" + itemId).remove();
}

// ================================================================
//  5. TRADES ENGINE
// ================================================================

/**
 * Creates a trade. Validates that BOTH offering AND seeking have content.
 */
async function createTrade(uid, fakepixelName, offering, seeking, description) {
  var offHasItems = offering.items && offering.items.length > 0 && offering.items.some(function (i) { return i.count > 0; });
  var offHasPurse = (offering.purse || 0) > 0;
  var seekHasItems = seeking.items && seeking.items.length > 0 && seeking.items.some(function (i) { return i.count > 0; });
  var seekHasPurse = (seeking.purse || 0) > 0;

  if (!offHasItems && !offHasPurse) {
    throw new Error("Offering must include at least one item (count > 0) or a Purse value.");
  }
  if (!seekHasItems && !seekHasPurse) {
    throw new Error("Seeking must include at least one item (count > 0) or a Purse value.");
  }

  var ref = db.ref("trades").push();
  await ref.set({
    userId:        uid,
    fakepixelName: fakepixelName,
    offering: {
      items: offering.items || [],
      purse: offering.purse || 0
    },
    seeking: {
      items: seeking.items || [],
      purse: seeking.purse || 0
    },
    description: description || "",
    status:      "open",
    createdAt:   firebase.database.ServerValue.TIMESTAMP
  });
  return ref.key;
}

function listenToTrades(callback) {
  var ref = db.ref("trades").orderByChild("createdAt");
  var handler = ref.on("value", function (snap) {
    var data = snap.val() || {};
    var list = Object.entries(data)
      .map(function (p) { return Object.assign({ id: p[0] }, p[1]); })
      .filter(function (t) { return t.status === "open"; })
      .reverse();
    callback(list);
  });
  return function () { ref.off("value", handler); };
}

async function deleteTrade(tradeId) {
  await db.ref("trades/" + tradeId).remove();
}

async function closeTrade(tradeId) {
  await db.ref("trades/" + tradeId).update({ status: "closed" });
}

// ================================================================
//  6. UTILITIES
// ================================================================

function timeAgo(ts) {
  if (!ts) return "Unknown";
  var s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5)     return "Just now";
  if (s < 60)    return s + "s ago";
  if (s < 3600)  return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  if (s < 604800) return Math.floor(s / 86400) + "d ago";
  return new Date(ts).toLocaleDateString();
}

function getRarityColor(rarity) {
  var map = {
    Common:    "text-slate-400",
    Uncommon:  "text-green-400",
    Rare:      "text-blue-400",
    Epic:      "text-purple-400",
    Legendary: "text-amber-400",
    Mythic:    "text-red-400"
  };
  return map[rarity] || "text-slate-400";
}

function getRarityBg(rarity) {
  var map = {
    Common:    "bg-slate-400/10 text-slate-400",
    Uncommon:  "bg-green-400/10 text-green-400",
    Rare:      "bg-blue-400/10 text-blue-400",
    Epic:      "bg-purple-400/10 text-purple-400",
    Legendary: "bg-amber-400/10 text-amber-400",
    Mythic:    "bg-red-400/10 text-red-400"
  };
  return map[rarity] || "bg-slate-400/10 text-slate-400";
}

function showToast(message, type) {
  type = type || "info";
  var colors = {
    success: "bg-emerald-600",
    error:   "bg-red-600",
    info:    "bg-violet-600",
    warning: "bg-amber-600"
  };
  var el = document.createElement("div");
  el.className = "fixed bottom-6 left-1/2 -translate-x-1/2 " +
    (colors[type] || colors.info) +
    " text-white px-6 py-3 rounded-xl shadow-2xl z-[9999] text-sm font-medium " +
    "transition-all duration-300 opacity-0 translate-y-4 max-w-[90vw] text-center";
  el.textContent = message;
  document.body.appendChild(el);

  requestAnimationFrame(function () {
    el.classList.remove("opacity-0", "translate-y-4");
    el.classList.add("opacity-100", "translate-y-0");
  });

  setTimeout(function () {
    el.classList.remove("opacity-100", "translate-y-0");
    el.classList.add("opacity-0", "translate-y-4");
    setTimeout(function () { el.remove(); }, 350);
  }, 3200);
}

function refreshIcons() {
  try { lucide.createIcons(); } catch (_) {}
}
