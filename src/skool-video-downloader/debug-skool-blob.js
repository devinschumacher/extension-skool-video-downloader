// Debug script for Skool blob video detection
// Test URL: https://www.skool.com/insightai-academy-3338/22cents-vs-12-cents-per-minute-voice-agent-can-you-tell-the-difference

console.log('🔍 Starting Skool blob video debug...');

// Find all video elements
const videos = document.querySelectorAll('video');
console.log(`✅ Found ${videos.length} video elements`);

videos.forEach((video, index) => {
    console.log(`\n📹 Video ${index + 1}:`);
    console.log('  - src:', video.src);
    console.log('  - currentSrc:', video.currentSrc);
    console.log('  - preload:', video.preload);
    console.log('  - crossorigin:', video.crossOrigin);
    
    // Check source elements
    const sources = video.querySelectorAll('source');
    if (sources.length > 0) {
        console.log(`  - Sources (${sources.length}):`);
        sources.forEach((source, i) => {
            console.log(`    Source ${i}: ${source.src}`);
        });
    }
    
    // Check track elements
    const tracks = video.querySelectorAll('track');
    if (tracks.length > 0) {
        console.log(`  - Tracks (${tracks.length}):`);
        tracks.forEach((track, i) => {
            console.log(`    Track ${i}:`, {
                kind: track.kind,
                label: track.label,
                src: track.src
            });
            
            // Look for video ID in thumbnail track
            if (track.kind === 'metadata' && track.src.includes('storyboard.vtt')) {
                const match = track.src.match(/\/([a-zA-Z0-9_-]+)\/storyboard\.vtt/);
                if (match) {
                    console.log(`    ✅ Found video ID in storyboard: ${match[1]}`);
                }
            }
        });
    }
    
    // Check parent elements for additional data
    let parent = video.parentElement;
    let depth = 0;
    while (parent && depth < 3) {
        if (parent.dataset) {
            const dataKeys = Object.keys(parent.dataset);
            if (dataKeys.length > 0) {
                console.log(`  - Parent ${depth} data attributes:`, parent.dataset);
            }
        }
        parent = parent.parentElement;
        depth++;
    }
});

// Check for video data in scripts
console.log('\n🔍 Checking page scripts for video data...');
const scripts = document.querySelectorAll('script');
scripts.forEach(script => {
    if (script.textContent && script.textContent.includes('video.skool.com')) {
        console.log('✅ Found script with video.skool.com reference');
        // Extract video URLs
        const matches = script.textContent.match(/https:\/\/[^"'\s]*video\.skool\.com[^"'\s]*/g);
        if (matches) {
            console.log('  - Video URLs found:', matches.slice(0, 3));
        }
    }
});

// Check __NEXT_DATA__
const nextData = document.getElementById('__NEXT_DATA__');
if (nextData && nextData.textContent.includes('video')) {
    console.log('\n✅ Found video references in __NEXT_DATA__');
    try {
        const data = JSON.parse(nextData.textContent);
        // Look for video-related data
        const searchForVideos = (obj, path = '') => {
            if (!obj || typeof obj !== 'object') return;
            
            for (const key in obj) {
                const currentPath = path ? `${path}.${key}` : key;
                const value = obj[key];
                
                if (typeof value === 'string' && value.includes('video.skool.com')) {
                    console.log(`  - Found video URL at ${currentPath}: ${value}`);
                }
                
                if (typeof value === 'object') {
                    searchForVideos(value, currentPath);
                }
            }
        };
        
        searchForVideos(data);
    } catch (e) {
        console.error('Error parsing __NEXT_DATA__:', e);
    }
}

console.log('\n✅ Debug complete!');