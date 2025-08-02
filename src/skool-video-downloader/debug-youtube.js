// Debug script for YouTube detection
// Run this on https://www.skool.com/insidermarketing/how-i-made-7180000-at-25-no-product-or-service

console.log('🔍 Starting YouTube Debug');

// 1. Check __NEXT_DATA__
console.log('\n1️⃣ Checking __NEXT_DATA__ for YouTube:');
const nextData = document.getElementById('__NEXT_DATA__');
if (nextData) {
    const content = nextData.textContent;
    console.log('__NEXT_DATA__ length:', content.length);
    
    // Look for videoLinks and videoLinksData
    if (content.includes('videoLinks')) {
        console.log('✅ Found "videoLinks" in content');
        
        // Try to find the exact pattern the user mentioned
        // 'videoLinks':'https://youtu.be/4sWwwNgMMuY','videoLinksData':'[{...}]'
        
        // First, let's find the context around videoLinks
        const videoLinksIndex = content.indexOf('videoLinks');
        const contextStart = Math.max(0, videoLinksIndex - 100);
        const contextEnd = Math.min(content.length, videoLinksIndex + 500);
        console.log('\n📝 Context around videoLinks:');
        console.log(content.substring(contextStart, contextEnd));
        
        // Try different patterns to match videoLinksData
        console.log('\n🔎 Trying to match videoLinksData patterns:');
        
        // Pattern 1: with double quotes
        const pattern1 = /"videoLinksData"\s*:\s*"(\[[\s\S]*?\])"/;
        const match1 = content.match(pattern1);
        console.log('Pattern 1 (double quotes):', match1 ? '✅ FOUND' : '❌ NOT FOUND');
        
        // Pattern 2: with single quotes (from user's example)
        const pattern2 = /'videoLinksData'\s*:\s*'(\[[\s\S]*?\])'/;
        const match2 = content.match(pattern2);
        console.log('Pattern 2 (single quotes):', match2 ? '✅ FOUND' : '❌ NOT FOUND');
        
        // Pattern 3: more flexible - capture anything between videoLinksData and the next field
        const pattern3 = /videoLinksData['"]\s*:\s*['"](.*?)['"](?:,\s*['"]\w+['"]\s*:|$)/;
        const match3 = content.match(pattern3);
        console.log('Pattern 3 (flexible):', match3 ? '✅ FOUND' : '❌ NOT FOUND');
        
        // Pattern 4: even more flexible - just find videoLinksData with array
        const pattern4 = /videoLinksData.*?(\[.*?\])/s;
        const match4 = content.match(pattern4);
        console.log('Pattern 4 (very flexible):', match4 ? '✅ FOUND' : '❌ NOT FOUND');
        
        // If we found any match, try to parse it
        const match = match1 || match2 || match3 || match4;
        if (match && match[1]) {
            console.log('\n🎯 Found videoLinksData!');
            console.log('Raw data:', match[1].substring(0, 200) + '...');
            
            try {
                // Unescape the JSON string
                const jsonString = match[1].replace(/\\"/g, '"').replace(/\\'/g, "'");
                console.log('\n📄 Unescaped JSON:', jsonString.substring(0, 200) + '...');
                
                const videoDataArray = JSON.parse(jsonString);
                console.log('\n✅ Successfully parsed JSON!');
                console.log('Number of videos:', videoDataArray.length);
                
                videoDataArray.forEach((video, i) => {
                    console.log(`\n📹 Video ${i + 1}:`);
                    console.log('  - video_id:', video.video_id);
                    console.log('  - url:', video.url);
                    console.log('  - title:', video.title);
                    console.log('  - thumbnail:', video.thumbnail);
                    console.log('  - provider:', video.provider);
                    console.log('  - duration (ms):', video.len_ms);
                });
            } catch (e) {
                console.error('❌ Error parsing videoLinksData:', e);
                console.log('Error details:', e.message);
            }
        }
        
        // Also check for simple videoLinks
        const simpleMatch = content.match(/['"]videoLinks['"]\s*:\s*['"]([^'"]+)['"]/);
        if (simpleMatch) {
            console.log('\n📎 Found simple videoLinks:', simpleMatch[1]);
        }
    }
    
    // Check for any YouTube URLs in the content
    console.log('\n🔗 All YouTube URLs found in __NEXT_DATA__:');
    const ytUrls = content.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/g);
    if (ytUrls) {
        ytUrls.forEach(url => console.log('  -', url));
    }
}

// 2. Check for YouTube iframes
console.log('\n2️⃣ Checking for YouTube iframes:');
const ytIframes = document.querySelectorAll('iframe[src*="youtube"], iframe[src*="youtu.be"]');
console.log('YouTube iframes found:', ytIframes.length);

// 3. Check for all iframes (might be lazy-loaded)
console.log('\n3️⃣ Checking all iframes:');
const allIframes = document.querySelectorAll('iframe');
console.log('Total iframes:', allIframes.length);
allIframes.forEach((iframe, i) => {
    console.log(`Iframe ${i + 1}: src="${iframe.src || 'no src'}", data-src="${iframe.dataset.src || 'no data-src'}"`);
});

// 4. Check for video containers that might contain YouTube
console.log('\n4️⃣ Checking video containers:');
const videoContainers = document.querySelectorAll('[class*="video"], [id*="video"], [data-video]');
console.log('Video containers found:', videoContainers.length);

// 5. Manual extension test
console.log('\n5️⃣ Extension Detection Test:');
if (typeof videoProviderRegistry !== 'undefined') {
    const youtubeProvider = videoProviderRegistry.getProviderByName('youtube');
    if (youtubeProvider) {
        console.log('Testing YouTube provider...');
        
        // Test classroom detection (which checks __NEXT_DATA__)
        const classroomVideos = youtubeProvider.detectInClassroom(document);
        console.log('Classroom detection result:', classroomVideos);
        
        if (classroomVideos.length > 0) {
            console.log('\n✅ Videos detected by extension:');
            classroomVideos.forEach((video, i) => {
                console.log(`Video ${i + 1}:`, video);
            });
        } else {
            console.log('❌ No videos detected by extension');
        }
    }
} else {
    console.log('❌ Extension not loaded');
}

console.log('\n🏁 YouTube Debug Complete');