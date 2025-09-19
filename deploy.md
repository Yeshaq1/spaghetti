# 🚀 Quick Deployment Guide

## Option 1: Netlify (Recommended)

1. **Go to**: [netlify.com/drop](https://app.netlify.com/drop)
2. **Drag and drop** the entire `ai-consulting-site` folder
3. **Wait** for deployment (usually 30-60 seconds)
4. **Get your URL** and share!

## Option 2: Vercel

1. **Install Vercel CLI**: `npm i -g vercel`
2. **Navigate** to the project folder: `cd ai-consulting-site`
3. **Run**: `vercel`
4. **Follow** the prompts
5. **Deploy!**

## Option 3: GitHub Pages

1. **Create** a new GitHub repository
2. **Upload** all files to the repository
3. **Go to** Settings > Pages
4. **Select** "Deploy from a branch"
5. **Choose** main/master branch
6. **Save** and wait for deployment

## Option 4: Any Web Host

1. **Upload** all files to your web server
2. **Ensure** the video file is accessible
3. **Test** the URL in a browser

## 📝 Before Deploying

- ✅ Replace `assets/videoplayback.mp4` with your video
- ✅ Update `videoPath` in `script.js` if needed
- ✅ Test locally by opening `index.html`
- ✅ Check video file size (keep under 50MB for best performance)

## 🎯 After Deploying

- ✅ Test on mobile and desktop
- ✅ Check video playback
- ✅ Verify scroll interactions work
- ✅ Test on different browsers

## 🔧 Troubleshooting

**Video not playing?**
- Check file path and format (MP4 recommended)
- Ensure video is accessible via URL
- Try with a smaller video file first

**Performance issues?**
- Compress your video file
- Reduce particle count in `script.js`
- Disable post-processing if needed

**Need help?**
- Check browser console for errors
- Test with a simple video first
- Verify all files uploaded correctly
