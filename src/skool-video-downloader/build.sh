#!/bin/bash

# Build script to concatenate modular JavaScript files into a single content.js

echo "Building content.js from modular files..."

# Output file
OUTPUT="content.js"

# Backup existing content.js
if [ -f "$OUTPUT" ]; then
    cp "$OUTPUT" "${OUTPUT}.backup"
    echo "Backed up existing content.js"
fi

# Start with a header
cat > "$OUTPUT" << 'EOF'
// Content script - runs on Skool classroom pages
// Version 1.3.2 - Built from modular files
// This file is auto-generated. Edit the source files in js/ directory instead.

EOF

# Concatenate the module files in order
echo "// === UTILS ===" >> "$OUTPUT"
cat js/utils.js >> "$OUTPUT"
echo -e "\n" >> "$OUTPUT"

echo "// === VIDEO DETECTION ===" >> "$OUTPUT"
cat js/videoDetection.js >> "$OUTPUT"
echo -e "\n" >> "$OUTPUT"

echo "// === MODAL UI ===" >> "$OUTPUT"
cat js/modal.js >> "$OUTPUT"
echo -e "\n" >> "$OUTPUT"

echo "// === MAIN CONTENT SCRIPT ===" >> "$OUTPUT"
cat content-modular.js >> "$OUTPUT"

echo "Build complete! content.js has been generated."
echo "Total lines: $(wc -l < "$OUTPUT")"