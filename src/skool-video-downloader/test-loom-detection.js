// Test script to verify Loom video detection
// Run this in the browser console on the page: https://www.skool.com/paid-ad-secrets/classroom/77c8adf4?md=69a3c91b5d5b45cf873abbfe1bdb02e5

console.log('🧪 Testing Loom video detection...');

// Look for the video element
const loomVideo = document.querySelector('video[id*="Loom"], video[data-loom-video-id]');
if (loomVideo) {
    console.log('✅ Found Loom video element:', loomVideo);
    console.log('  - ID:', loomVideo.id);
    console.log('  - data-loom-video-id:', loomVideo.getAttribute('data-loom-video-id'));
    
    // Check for caption tracks
    const tracks = loomVideo.querySelectorAll('track');
    console.log('  - Track count:', tracks.length);
    tracks.forEach((track, i) => {
        console.log(`  - Track ${i} src:`, track.src);
        if (track.src.includes('loom.com')) {
            const match = track.src.match(/\/captions\/([a-zA-Z0-9]+)(?:-\d+)?\.vtt/);
            if (match) {
                console.log('  ✅ Extracted video ID from caption:', match[1]);
            }
        }
    });
} else {
    console.log('❌ No Loom video element found');
}

// Also check for iframes
const loomIframes = document.querySelectorAll('iframe[src*="loom.com"]');
console.log('\n🔍 Loom iframes found:', loomIframes.length);
loomIframes.forEach((iframe, i) => {
    console.log(`  - Iframe ${i} src:`, iframe.src);
});

// Check page data
const nextData = document.getElementById('__NEXT_DATA__');
if (nextData && nextData.textContent.includes('loom')) {
    console.log('\n✅ Found "loom" reference in __NEXT_DATA__');
    const matches = nextData.textContent.match(/loom\.com\/(?:share|embed|record|s)\/([a-zA-Z0-9]+)/g);
    if (matches) {
        console.log('  - Found URLs:', matches);
    }
}

console.log('\n✅ Test complete!');