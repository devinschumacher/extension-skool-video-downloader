// Automated Test Runner for Skool Video Downloader Extension
// This script can be injected into the extension to automatically test all URLs

class AutomatedTestRunner {
    constructor() {
        this.testUrls = [
            // Classroom Pages
            { 
                url: 'https://www.skool.com/the-blueprint-training/classroom/50c1bb36?md=40cc37d92f44450daceb4a47dbb1bf87',
                type: 'classroom',
                name: 'Blueprint Training Classroom'
            },
            { 
                url: 'https://www.skool.com/insightai-academy-3338/classroom/0391d00a?md=2e40024f8b5a4dc5a2a3bb5ffcb3e4c9',
                type: 'classroom',
                name: 'InsightAI Academy Classroom'
            },
            { 
                url: 'https://www.skool.com/paid-ad-secrets/classroom/77c8adf4?md=69a3c91b5d5b45cf873abbfe1bdb02e5',
                type: 'classroom',
                name: 'Paid Ad Secrets Classroom'
            },
            { 
                url: 'https://www.skool.com/wholesaling/classroom/3acfb08a?md=a660699dac7941da8fb33405a6484e7f',
                type: 'classroom',
                name: 'Wholesaling Classroom'
            },
            
            // Community Posts
            { 
                url: 'https://www.skool.com/the-blueprint-training/50-off-traffic-projection-tool',
                type: 'community',
                name: 'Blueprint Training Post'
            },
            { 
                url: 'https://www.skool.com/insidermarketing/how-i-made-7180000-at-25-no-product-or-service',
                type: 'community',
                name: 'Insider Marketing Post'
            },
            { 
                url: 'https://www.skool.com/garretts-group-7439/add-3x-rev-to-your-business-use-this-mini-ai-lead-accelerator',
                type: 'community',
                name: 'Garretts Group Post'
            },
            { 
                url: 'https://www.skool.com/insightai-academy-3338/22cents-vs-12-cents-per-minute-voice-agent-can-you-tell-the-difference',
                type: 'community',
                name: 'InsightAI Academy Post'
            },
            
            // About Page
            { 
                url: 'https://www.skool.com/theaspinallway/about',
                type: 'about',
                name: 'TheAspinallWay About'
            }
        ];
        
        this.results = [];
        this.currentTestIndex = 0;
    }
    
    // Start automated testing
    async runAllTests() {
        console.log('🚀 Starting Automated Test Runner');
        console.log(`Testing ${this.testUrls.length} URLs...`);
        
        this.results = [];
        
        for (let i = 0; i < this.testUrls.length; i++) {
            const testCase = this.testUrls[i];
            console.log(`\n📍 Test ${i + 1}/${this.testUrls.length}: ${testCase.name}`);
            
            try {
                const result = await this.testUrl(testCase);
                this.results.push(result);
                
                // Wait between tests to avoid overwhelming
                await this.sleep(1000);
            } catch (error) {
                console.error(`❌ Test failed for ${testCase.name}:`, error);
                this.results.push({
                    ...testCase,
                    success: false,
                    error: error.message,
                    videos: [],
                    logs: []
                });
            }
        }
        
        this.generateReport();
    }
    
    // Test a single URL by opening it in a new tab and running detection
    async testUrl(testCase) {
        return new Promise((resolve) => {
            console.log(`🔍 Testing: ${testCase.url}`);
            
            // Store original console.log to capture logs
            const originalLog = console.log;
            const capturedLogs = [];
            
            // Capture provider logs
            console.log = function(...args) {
                const message = args.join(' ');
                if (message.includes('🎬') || message.includes('🔍')) {
                    capturedLogs.push(message);
                }
                originalLog.apply(console, args);
            };
            
            // Open URL in new tab
            const newTab = window.open(testCase.url, '_blank');
            
            // Wait for page to load and run detection
            setTimeout(() => {
                try {
                    // Inject detection code into the new tab
                    const testScript = `
                        // Run video detection
                        if (typeof detectVideosByLocation !== 'undefined' && typeof videoProviderRegistry !== 'undefined') {
                            const videos = detectVideosByLocation(videoProviderRegistry);
                            window.testResult = {
                                videos: videos,
                                location: detectPageLocation ? detectPageLocation() : 'unknown',
                                timestamp: new Date().toISOString()
                            };
                        } else {
                            window.testResult = {
                                error: 'Extension not loaded or functions not available',
                                videos: [],
                                location: 'unknown'
                            };
                        }
                    `;
                    
                    // Try to execute in new tab
                    if (newTab && !newTab.closed) {
                        try {
                            newTab.eval(testScript);
                            
                            // Get results
                            setTimeout(() => {
                                let result = {
                                    ...testCase,
                                    success: true,
                                    videos: [],
                                    detectedLocation: 'unknown',
                                    logs: capturedLogs
                                };
                                
                                try {
                                    if (newTab.testResult) {
                                        result.videos = newTab.testResult.videos || [];
                                        result.detectedLocation = newTab.testResult.location;
                                        result.error = newTab.testResult.error;
                                        result.success = !newTab.testResult.error;
                                    }
                                } catch (e) {
                                    result.error = 'Could not access test results: ' + e.message;
                                    result.success = false;
                                }
                                
                                // Close tab
                                newTab.close();
                                
                                // Restore console.log
                                console.log = originalLog;
                                
                                resolve(result);
                            }, 3000);
                            
                        } catch (e) {
                            newTab.close();
                            console.log = originalLog;
                            resolve({
                                ...testCase,
                                success: false,
                                error: 'Script injection failed: ' + e.message,
                                videos: [],
                                logs: capturedLogs
                            });
                        }
                    } else {
                        console.log = originalLog;
                        resolve({
                            ...testCase,
                            success: false,
                            error: 'Could not open new tab',
                            videos: [],
                            logs: capturedLogs
                        });
                    }
                    
                } catch (error) {
                    console.log = originalLog;
                    resolve({
                        ...testCase,
                        success: false,
                        error: error.message,
                        videos: [],
                        logs: capturedLogs
                    });
                }
            }, 2000); // Wait for page load
        });
    }
    
    // Generate comprehensive test report
    generateReport() {
        console.log('\n📊 === AUTOMATED TEST REPORT ===');
        
        const summary = {
            total: this.results.length,
            successful: this.results.filter(r => r.success).length,
            failed: this.results.filter(r => !r.success).length,
            videosFound: this.results.reduce((sum, r) => sum + r.videos.length, 0)
        };
        
        console.log(`\n📈 Summary:`);
        console.log(`  Total Tests: ${summary.total}`);
        console.log(`  Successful: ${summary.successful}`);
        console.log(`  Failed: ${summary.failed}`);
        console.log(`  Videos Found: ${summary.videosFound}`);
        console.log(`  Success Rate: ${((summary.successful / summary.total) * 100).toFixed(1)}%`);
        
        // Detailed results
        console.log(`\n📋 Detailed Results:`);
        this.results.forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.name}`);
            console.log(`   URL: ${result.url}`);
            console.log(`   Type: ${result.type} | Detected: ${result.detectedLocation}`);
            console.log(`   Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
            
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
            
            if (result.videos.length > 0) {
                console.log(`   Videos Found: ${result.videos.length}`);
                result.videos.forEach((video, i) => {
                    console.log(`     ${i + 1}. ${video.provider || video.type}: ${video.url}`);
                });
            } else {
                console.log(`   Videos Found: 0`);
            }
            
            if (result.logs.length > 0) {
                console.log(`   Key Logs: ${result.logs.length} entries`);
            }
        });
        
        // Provider analysis
        const providerStats = {};
        this.results.forEach(result => {
            result.videos.forEach(video => {
                const provider = video.provider || video.type || 'unknown';
                providerStats[provider] = (providerStats[provider] || 0) + 1;
            });
        });
        
        console.log(`\n🎬 Provider Statistics:`);
        Object.entries(providerStats).forEach(([provider, count]) => {
            console.log(`  ${provider}: ${count} videos`);
        });
        
        // Location analysis
        const locationStats = {};
        this.results.forEach(result => {
            const key = `${result.type} → ${result.detectedLocation}`;
            locationStats[key] = (locationStats[key] || 0) + 1;
        });
        
        console.log(`\n📍 Location Detection:`);
        Object.entries(locationStats).forEach(([location, count]) => {
            console.log(`  ${location}: ${count} pages`);
        });
        
        console.log(`\n🏁 Automated Testing Complete`);
        
        return {
            summary,
            results: this.results,
            providerStats,
            locationStats
        };
    }
    
    // Utility function for delays
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Run a quick test on current page only
    testCurrentPage() {
        console.log('🧪 Testing Current Page');
        
        // Detect page type
        const url = window.location.href;
        let pageType = 'unknown';
        
        if (url.includes('/classroom/') || url.includes('?md=')) {
            pageType = 'classroom';
        } else if (url.includes('/community/') || url.includes('/posts/')) {
            pageType = 'community';
        } else if (url.includes('/about')) {
            pageType = 'about';
        }
        
        console.log(`📍 Detected page type: ${pageType}`);
        console.log(`🔗 Current URL: ${url}`);
        
        // Run detection if available
        if (typeof detectVideosByLocation !== 'undefined' && typeof videoProviderRegistry !== 'undefined') {
            console.log('🔍 Running video detection...');
            const videos = detectVideosByLocation(videoProviderRegistry);
            
            console.log(`✅ Detection complete:`);
            console.log(`   Videos found: ${videos.length}`);
            
            videos.forEach((video, i) => {
                console.log(`   ${i + 1}. ${video.provider || video.type}: ${video.title || 'Untitled'}`);
                console.log(`      URL: ${video.url}`);
            });
            
            return {
                pageType,
                url,
                videos,
                success: true
            };
        } else {
            console.log('❌ Extension not loaded or functions not available');
            return {
                pageType,
                url,
                videos: [],
                success: false,
                error: 'Extension not loaded'
            };
        }
    }
}

// Create global instance
window.testRunner = new AutomatedTestRunner();

// Quick access functions
window.runAllTests = () => window.testRunner.runAllTests();
window.testCurrentPage = () => window.testRunner.testCurrentPage();

console.log('🤖 Automated Test Runner Loaded');
console.log('Usage:');
console.log('  runAllTests() - Test all 9 URLs automatically');
console.log('  testCurrentPage() - Test current page only');
console.log('  testRunner.results - View last test results');