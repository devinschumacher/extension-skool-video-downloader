// Test script to verify Skool blob video detection
// Run this in the browser console on: https://www.skool.com/insightai-academy-3338/22cents-vs-12-cents-per-minute-voice-agent-can-you-tell-the-difference

console.log('🧪 Testing Skool blob video detection...');

// Find all video elements
const videos = document.querySelectorAll('video');
console.log(`✅ Found ${videos.length} video elements`);

videos.forEach((video, index) => {
    console.log(`\n📹 Video ${index + 1}:`);
    console.log('  - src:', video.src);
    
    // Look for storyboard track to extract video ID
    const storyboardTrack = video.querySelector('track[src*="storyboard.vtt"]');
    if (storyboardTrack) {
        console.log('  - Storyboard track:', storyboardTrack.src);
        const match = storyboardTrack.src.match(/\/([a-zA-Z0-9_-]+)\/storyboard\.vtt/);
        if (match) {
            const videoId = match[1];
            console.log('  ✅ Extracted video ID:', videoId);
            console.log('  📸 Generated thumbnail URL:', `https://image.video.skool.com/${videoId}/thumbnail.jpg`);
            
            // Test if thumbnail loads
            const img = new Image();
            img.onload = () => console.log('  ✅ Thumbnail loads successfully!');
            img.onerror = () => console.log('  ❌ Thumbnail failed to load');
            img.src = `https://image.video.skool.com/${videoId}/thumbnail.jpg`;
        }
    }
    
    // Check all tracks
    const tracks = video.querySelectorAll('track');
    console.log(`  - Total tracks: ${tracks.length}`);
    tracks.forEach((track, i) => {
        if (track.src.includes('video.skool.com')) {
            console.log(`  - Track ${i} (${track.kind}):`, track.src);
        }
    });
});

console.log('\n✅ Test complete!');