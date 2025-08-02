// Build script to combine all JS modules into content.js
const fs = require('fs');
const path = require('path');

// Define the order of files to concatenate
const fileOrder = [
    // Core utilities
    'js/utils.js',
    
    // Provider system
    'js/providers/baseProvider.js',
    'js/providers/youtubeProvider.js',
    'js/providers/loomProvider.js',
    'js/providers/vimeoProvider.js',
    'js/providers/wistiaProvider.js',
    'js/providers/skoolProvider.js',
    'js/providerRegistry.js',
    
    // Detection logic
    'js/videoDetection.js',
    'js/classroomVideo.js',
    'js/locationDetectors.js',
    'js/dynamicDetection.js',
    
    // UI components
    'js/modal-v2.js',
    'js/floatingButton.js',
    
    // Main orchestration
    'js/content-main-v2.js',
    
    // Initialization (new)
    'js/content-init.js'
];

// Build the content script
function buildContentScript() {
    console.log('🔨 Building content.js...');
    
    let content = `// Content script - runs on Skool classroom pages
// Version 1.3.3 - Built from modular files
// This file is auto-generated. Edit the source files in js/ directory instead.

`;
    
    let successCount = 0;
    let errorCount = 0;
    
    fileOrder.forEach(file => {
        const filePath = path.join(__dirname, file);
        
        try {
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                
                // Extract the main comment from the file
                const firstLine = fileContent.split('\n')[0];
                const sectionName = firstLine.replace('//', '').trim();
                
                // Add section separator
                content += `\n// === ${sectionName.toUpperCase()} ===\n`;
                content += fileContent;
                content += '\n';
                
                console.log(`✅ Added ${file}`);
                successCount++;
            } else {
                console.log(`❌ File not found: ${file}`);
                errorCount++;
            }
        } catch (error) {
            console.error(`❌ Error reading ${file}:`, error.message);
            errorCount++;
        }
    });
    
    // Write the combined content
    const outputPath = path.join(__dirname, 'content.js');
    fs.writeFileSync(outputPath, content);
    
    console.log(`\n✅ Build complete!`);
    console.log(`   Success: ${successCount} files`);
    console.log(`   Errors: ${errorCount} files`);
    console.log(`   Output: ${outputPath}`);
    
    // Calculate file size
    const stats = fs.statSync(outputPath);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);
    console.log(`   Size: ${fileSizeInKB} KB`);
}

// Run the build
buildContentScript();