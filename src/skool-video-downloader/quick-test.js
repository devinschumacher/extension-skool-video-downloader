// Quick Test Script - Run this in browser console on any Skool page
// This simulates what the extension does and shows detailed results

(function() {
    console.log('🚀 Quick Extension Test Started');
    
    // Test URLs for reference
    const testUrls = {
        classroom: [
            'https://www.skool.com/the-blueprint-training/classroom/50c1bb36?md=40cc37d92f44450daceb4a47dbb1bf87',
            'https://www.skool.com/insightai-academy-3338/classroom/0391d00a?md=2e40024f8b5a4dc5a2a3bb5ffcb3e4c9',
            'https://www.skool.com/paid-ad-secrets/classroom/77c8adf4?md=69a3c91b5d5b45cf873abbfe1bdb02e5',
            'https://www.skool.com/wholesaling/classroom/3acfb08a?md=a660699dac7941da8fb33405a6484e7f'
        ],
        community: [
            'https://www.skool.com/the-blueprint-training/50-off-traffic-projection-tool',
            'https://www.skool.com/insidermarketing/how-i-made-7180000-at-25-no-product-or-service',
            'https://www.skool.com/garretts-group-7439/add-3x-rev-to-your-business-use-this-mini-ai-lead-accelerator',
            'https://www.skool.com/insightai-academy-3338/22cents-vs-12-cents-per-minute-voice-agent-can-you-tell-the-difference'
        ],
        about: [
            'https://www.skool.com/theaspinallway/about'
        ]
    };
    
    // Detect current page location
    function detectPageLocation() {
        const url = window.location.href;
        const pathname = window.location.pathname;
        
        if (url.includes('/classroom/') || url.includes('?md=')) {
            return 'classroom';
        }
        if (url.includes('/community/') || pathname.includes('/posts/')) {
            return 'community';
        }
        if (pathname.includes('/about')) {
            return 'about';
        }
        return 'unknown';
    }
    
    const currentLocation = detectPageLocation();
    const currentUrl = window.location.href;
    
    console.log('📍 Current Page Analysis:');
    console.log(`   Location Type: ${currentLocation}`);
    console.log(`   URL: ${currentUrl}`);
    
    // Check if current URL matches test URLs
    let urlMatch = null;
    Object.entries(testUrls).forEach(([type, urls]) => {
        urls.forEach(url => {
            if (currentUrl.includes(url.split('?')[0])) {
                urlMatch = { type, url };
            }
        });
    });
    
    if (urlMatch) {
        console.log(`✅ This is a known test URL (${urlMatch.type})`);
    } else {
        console.log('ℹ️ This is not one of the primary test URLs');
    }
    
    // Test video detection simulation
    console.log('\n🔍 Video Detection Simulation:');
    
    // 1. Check for __NEXT_DATA__ (classroom detection)
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    if (nextDataScript) {
        console.log('✅ Found __NEXT_DATA__ script');
        const content = nextDataScript.textContent;
        
        // Test each provider pattern
        const providers = [
            { name: 'YouTube', patterns: [/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/g, /youtu\.be\/([a-zA-Z0-9_-]+)/g] },
            { name: 'Vimeo', patterns: [/vimeo\.com\/([0-9]+)/g, /player\.vimeo\.com\/video\/([0-9]+)/g] },
            { name: 'Loom', patterns: [/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/g] },
            { name: 'Wistia', patterns: [/wistia\.(?:com|net)\/medias\/([a-zA-Z0-9]+)/g] },
            { name: 'Skool', patterns: [/(https:\/\/[^"]*\.skool\.com[^"]*\.mp4)/g] }
        ];
        
        providers.forEach(provider => {
            console.log(`\n🎬 Testing ${provider.name} in __NEXT_DATA__:`);
            let found = false;
            
            provider.patterns.forEach((pattern, i) => {
                const matches = [...content.matchAll(pattern)];
                if (matches.length > 0) {
                    found = true;
                    console.log(`   ✅ Pattern ${i + 1}: ${matches.length} matches`);
                    matches.slice(0, 3).forEach((match, j) => {
                        console.log(`      ${j + 1}. ID: ${match[1]}`);
                    });
                    if (matches.length > 3) {
                        console.log(`      ... and ${matches.length - 3} more`);
                    }
                }
            });
            
            if (!found) {
                console.log(`   ❌ No ${provider.name} references found`);
            }
        });
    } else {
        console.log('❌ No __NEXT_DATA__ script found');
    }
    
    // 2. Check DOM elements (community/about detection)
    console.log('\n🔍 DOM Element Detection:');
    
    // Find main content container
    const containers = [
        document.querySelector('main'),
        document.querySelector('article'),
        document.querySelector('.content'),
        document.querySelector('[class*="post"]'),
        document.body
    ].filter(Boolean);
    
    const mainContainer = containers[0];
    console.log(`📦 Using container: ${mainContainer.tagName}${mainContainer.className ? '.' + mainContainer.className.split(' ')[0] : ''}`);
    
    // Test DOM detection
    const iframes = mainContainer.querySelectorAll('iframe');
    const links = mainContainer.querySelectorAll('a[href]');
    const videos = mainContainer.querySelectorAll('video');
    const images = mainContainer.querySelectorAll('img[src]');
    
    console.log(`\n📊 DOM Content Summary:`);
    console.log(`   Iframes: ${iframes.length}`);
    console.log(`   Links: ${links.length}`);
    console.log(`   Video elements: ${videos.length}`);
    console.log(`   Images: ${images.length}`);
    
    // Check iframes for video providers
    console.log(`\n🖼️ Iframe Analysis:`);
    if (iframes.length > 0) {
        Array.from(iframes).forEach((iframe, i) => {
            console.log(`   ${i + 1}. ${iframe.src || 'no src'}`);
            
            const providers = ['youtube', 'vimeo', 'loom', 'wistia'];
            providers.forEach(provider => {
                if (iframe.src && iframe.src.includes(provider)) {
                    console.log(`      ✅ Contains ${provider}`);
                }
            });
        });
    } else {
        console.log('   No iframes found');
    }
    
    // Check links for video platforms
    console.log(`\n🔗 Video Link Analysis:`);
    const videoLinks = Array.from(links).filter(link => {
        return link.href && (
            link.href.includes('youtube') ||
            link.href.includes('vimeo') ||
            link.href.includes('loom') ||
            link.href.includes('wistia') ||
            link.href.includes('.mp4')
        );
    });
    
    if (videoLinks.length > 0) {
        videoLinks.forEach((link, i) => {
            console.log(`   ${i + 1}. ${link.href}`);
        });
    } else {
        console.log('   No video platform links found');
    }
    
    // Check video elements
    if (videos.length > 0) {
        console.log(`\n🎥 Native Video Elements:`);
        Array.from(videos).forEach((video, i) => {
            const src = video.src || (video.querySelector('source') && video.querySelector('source').src);
            console.log(`   ${i + 1}. ${src || 'no src'}`);
        });
    }
    
    // Test extension integration
    console.log(`\n🔌 Extension Integration Test:`);
    
    // Simulate extension message
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        console.log('✅ Chrome extension API available');
        
        // Try to trigger video extraction
        try {
            chrome.runtime.sendMessage({ action: 'extractVideo' }, response => {
                if (chrome.runtime.lastError) {
                    console.log('❌ Extension communication error:', chrome.runtime.lastError.message);
                } else {
                    console.log('✅ Extension response received:', response);
                    if (response && response.videos) {
                        console.log(`📺 Extension found ${response.videos.length} videos:`);
                        response.videos.forEach((video, i) => {
                            console.log(`   ${i + 1}. ${video.type || video.provider}: ${video.title || video.url}`);
                        });
                    }
                }
            });
        } catch (e) {
            console.log('❌ Extension message failed:', e.message);
        }
    } else {
        console.log('❌ Chrome extension API not available');
    }
    
    // Summary and recommendations
    console.log(`\n📋 Test Summary:`);
    console.log(`   Page Type: ${currentLocation}`);
    console.log(`   Has __NEXT_DATA__: ${nextDataScript ? 'Yes' : 'No'}`);
    console.log(`   Total Iframes: ${iframes.length}`);
    console.log(`   Video Links: ${videoLinks.length}`);
    console.log(`   Native Videos: ${videos.length}`);
    
    console.log(`\n💡 Recommendations:`);
    if (currentLocation === 'classroom' && !nextDataScript) {
        console.log('   ⚠️ Classroom page without __NEXT_DATA__ - may need DOM fallback');
    }
    if (iframes.length === 0 && videoLinks.length === 0 && videos.length === 0) {
        console.log('   ⚠️ No obvious video content found - page may load videos dynamically');
    }
    if (currentLocation === 'unknown') {
        console.log('   ⚠️ Page type not recognized - may need pattern updates');
    }
    
    console.log(`\n🏁 Quick Test Complete`);
    
})();