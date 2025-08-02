# yt-dlp Troubleshooting Guide

If you're having issues with yt-dlp after installing the .pkg file, try these solutions:

## Solution 1: Manual Installation via Terminal

Open Terminal and run:
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install yt-dlp
brew install yt-dlp
```

## Solution 2: Direct Download

1. Download yt-dlp directly:
```bash
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

## Solution 3: Python pip installation

If you have Python installed:
```bash
python3 -m pip install --upgrade yt-dlp
```

## Verify Installation

After installation, verify yt-dlp is working:
```bash
yt-dlp --version
```

## Common Issues

### "command not found" error
- Make sure `/usr/local/bin` is in your PATH
- Try running with full path: `/usr/local/bin/yt-dlp`

### Permission denied
- Use `sudo` when installing
- Make sure the file has execute permissions

### macOS Security Block
- Go to System Preferences > Security & Privacy
- Click "Allow Anyway" if yt-dlp was blocked

## Still Having Issues?

Visit the [community support](https://serp.ly/@serp/community/support) for help.