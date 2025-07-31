// Background script for license verification

// Your Gumroad product ID - REPLACE THIS with your actual product ID
const GUMROAD_PRODUCT_ID = 'YOUR_PRODUCT_ID_HERE';

// Check if user has valid license
async function checkLicense() {
  const result = await chrome.storage.local.get(['licenseKey', 'licenseValid']);
  return result.licenseValid === true;
}

// Verify license with Gumroad API
async function verifyLicenseWithGumroad(licenseKey) {
  // For Gumroad, we need to either:
  // 1. Use a server-side proxy (most secure)
  // 2. Use the license key format validation (simpler)
  
  // Option 2: Simple format validation
  // Gumroad keys are usually in format: XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
  const gumroadKeyPattern = /^[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8}$/;
  
  if (gumroadKeyPattern.test(licenseKey)) {
    // Store the license
    await chrome.storage.local.set({
      licenseKey: licenseKey,
      licenseValid: true,
      activatedAt: new Date().toISOString()
    });
    return { success: true };
  } else {
    return { success: false, error: 'Invalid license key format' };
  }
  
  // TODO: For production, implement server-side verification:
  // 1. Create a simple server endpoint (Vercel, Netlify Functions, etc.)
  // 2. Store your Gumroad API key on the server
  // 3. Extension calls your server, server calls Gumroad
}

// Fetch Loom video metadata
async function fetchLoomMetadata(videoId) {
  try {
    // Try to fetch from Loom's public share page
    const response = await fetch(`https://www.loom.com/share/${videoId}`);
    const html = await response.text();
    
    // Extract title from meta tags
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : null;
    
    return { title };
  } catch (error) {
    console.error('Error fetching Loom metadata:', error);
    return { title: null };
  }
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'verifyLicense') {
    verifyLicenseWithGumroad(request.licenseKey)
      .then(result => sendResponse(result));
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'checkLicense') {
    checkLicense().then(isValid => sendResponse({ isValid }));
    return true;
  }
  
  if (request.action === 'clearLicense') {
    chrome.storage.local.remove(['licenseKey', 'licenseValid', 'purchaseData'])
      .then(() => sendResponse({ success: true }));
    return true;
  }
  
  if (request.action === 'fetchLoomMetadata') {
    fetchLoomMetadata(request.videoId)
      .then(metadata => sendResponse(metadata));
    return true;
  }
});

// Check license when extension starts
chrome.runtime.onInstalled.addListener(async () => {
  const hasLicense = await checkLicense();
  if (!hasLicense) {
    // Open popup to prompt for license
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
  }
});