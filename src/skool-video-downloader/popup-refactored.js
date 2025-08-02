// Refactored popup script - cleaner and more modular

import { LicenseManager } from './js/popup/licenseManager.js';
import { enrichVideosWithMetadata } from './js/popup/videoMetadata.js';
import { generateVideosHtml } from './js/popup/videoRenderer.js';
import { setupCopyButtons } from './js/popup/copyManager.js';

// DOM elements
const elements = {
  loadingDiv: null,
  licenseContent: null,
  activatedContent: null,
  activateBtn: null,
  deactivateBtn: null,
  licenseInput: null,
  errorMessage: null,
  videoResult: null
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup script loaded');
  
  // Get DOM elements
  initializeElements();
  
  // Initialize license manager
  const licenseManager = new LicenseManager(elements);
  licenseManager.setOnActivated(extractVideos);
  
  // Show loading state
  showLoading(true);
  
  // Check license and show appropriate UI
  const isLicensed = await licenseManager.checkLicense();
  showLoading(false);
  
  if (isLicensed) {
    showActivatedState();
    await extractVideos();
  } else {
    showLicenseInput();
  }
});

// Initialize DOM element references
function initializeElements() {
  elements.loadingDiv = document.getElementById('loading');
  elements.licenseContent = document.getElementById('license-content');
  elements.activatedContent = document.getElementById('activated-content');
  elements.activateBtn = document.getElementById('activate-btn');
  elements.deactivateBtn = document.getElementById('deactivate-btn');
  elements.licenseInput = document.getElementById('license-input');
  elements.errorMessage = document.getElementById('error-message');
  elements.videoResult = document.getElementById('video-result');
}

// UI state management
function showLoading(show) {
  elements.loadingDiv.style.display = show ? 'block' : 'none';
}

function showActivatedState() {
  elements.activatedContent.style.display = 'block';
  elements.licenseContent.style.display = 'none';
}

function showLicenseInput() {
  elements.licenseContent.style.display = 'block';
  elements.activatedContent.style.display = 'none';
}

// Extract and display videos
async function extractVideos() {
  showVideoStatus('Checking for videos...');
  
  // Check if we're on Skool.com
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes('skool.com')) {
    showVideoError('This extension only works on Skool.com pages');
    return;
  }
  
  // Get videos from storage
  chrome.storage.local.get(['detectedVideos'], async (result) => {
    const videos = result.detectedVideos || [];
    
    if (videos.length > 0) {
      await displayVideos(videos);
    } else {
      showVideoWarning('No videos found on this page. Make sure you\'re on a Skool page with a video.');
    }
  });
}

// Display videos with metadata
async function displayVideos(videos) {
  console.log(`Found ${videos.length} video(s)`);
  
  // Enrich videos with metadata
  const videosWithMetadata = await enrichVideosWithMetadata(videos);
  
  // Log for debugging
  videosWithMetadata.forEach((video, index) => {
    console.log('📺 Processing video:', video);
    console.log('📺 Video thumbnail:', video.thumbnail);
  });
  
  // Generate and display HTML
  const videosHtml = generateVideosHtml(videosWithMetadata);
  elements.videoResult.innerHTML = videosHtml;
  
  // Setup copy button handlers
  setupCopyButtons();
}

// Status display helpers
function showVideoStatus(message) {
  elements.videoResult.innerHTML = `
    <div style="text-align: center; color: #6b7280; padding: 20px;">
      ${message}
    </div>
  `;
}

function showVideoError(message) {
  elements.videoResult.innerHTML = `
    <div style="padding: 12px; background: #fee2e2; color: #991b1b; border-radius: 8px;">
      ${message}
    </div>
  `;
}

function showVideoWarning(message) {
  elements.videoResult.innerHTML = `
    <div style="padding: 12px; background: #fef3c7; color: #92400e; border-radius: 8px;">
      ${message}
    </div>
  `;
}