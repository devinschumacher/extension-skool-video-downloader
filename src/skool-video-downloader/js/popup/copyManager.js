// Copy button functionality

export function setupCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', handleCopyClick);
  });
}

function handleCopyClick(event) {
  const button = event.currentTarget;
  const command = button.getAttribute('data-command');
  
  // Decode HTML entities
  const decodedCommand = decodeHtmlEntities(command);
  
  console.log('Copying command:', decodedCommand);
  
  copyToClipboard(decodedCommand, button);
}

function decodeHtmlEntities(html) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}

async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    
    // Show success feedback
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
    
    // Show error feedback
    const originalText = button.textContent;
    button.textContent = 'Failed!';
    button.style.background = '#ef4444';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 2000);
  }
}