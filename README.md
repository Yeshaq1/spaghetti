# AI AI AI - Immersive Three.js Experience

A cinematic full-screen landing page built with vanilla JavaScript and Three.js, featuring an immersive video texture, animated text, and scroll-triggered interactions.

## 🎬 Features

- **Full-Screen WebGL Scene**: Immersive Three.js canvas that fills the browser window
- **Video Texture**: Curved 3D plane displaying video with subtle curvature and glow effects
- **Animated Text**: Dynamic "AI AI AI" text with wave distortion, pulsing, and rotation
- **Visual Effects**: 
  - CRT-style scanline overlay
  - Bloom post-processing
  - Ambient particle system
  - Mouse parallax camera movement
- **Scroll Interactions**: 
  - Volume fade on scroll
  - Story sections reveal
  - Camera movement and zoom
- **Responsive Design**: Scales properly on mobile and desktop
- **Performance Optimized**: Efficient rendering and resource management

## 🚀 Quick Start

1. **Clone or download** this repository
2. **Add your video**: Place your video file at `assets/videoplayback.mp4` (or update the path in `script.js`)
3. **Open `index.html`** in a modern web browser
4. **Enjoy the experience!**

## 📁 File Structure

```
ai-consulting-site/
├── index.html          # Main HTML file
├── script.js           # Three.js experience logic
├── assets/
│   └── videoplayback.mp4  # Video file (replace with your own)
├── favicon.svg         # Site favicon
├── og-image.svg        # Open Graph image
└── README.md           # This file
```

## ⚙️ Configuration

Edit the `CONFIG` object in `script.js` to customize:

```javascript
const CONFIG = {
    // Video settings
    videoPath: 'assets/videoplayback.mp4', // Your video path
    videoVolume: 0.7,                      // Initial volume
    
    // Text settings
    textContent: 'AI AI AI',              // Text to display
    textSize: 0.8,                        // Text size
    textHeight: 0.1,                      // Text depth
    
    // Animation settings
    textWaveAmplitude: 0.3,               // Wave distortion strength
    textWaveSpeed: 1.5,                   // Wave animation speed
    textPulseSpeed: 2.0,                  // Pulsing speed
    textRotationSpeed: 0.5,               // Rotation speed
    
    // Visual effects
    bloomStrength: 1.2,                   // Bloom effect strength
    bloomRadius: 0.4,                     // Bloom radius
    bloomThreshold: 0.1,                  // Bloom threshold
    
    // Colors
    textColor: 0x73fbd3,                  // Main text color
    glowColor: 0x8a7efc,                  // Glow color
    backgroundColor: 0x000000,            // Background color
    
    // Performance
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    enablePostProcessing: true
};
```

## 🎨 Customization

### Changing the Video

1. Replace `assets/videoplayback.mp4` with your video file
2. Update the `videoPath` in the CONFIG object if using a different path
3. Ensure your video is optimized for web (MP4, H.264 codec recommended)

### Modifying the Text

1. Change `textContent` in CONFIG to your desired text
2. Adjust `textSize` and `textHeight` for different dimensions
3. Modify animation parameters for different effects

### Adjusting Colors

1. Update `textColor` and `glowColor` for different text appearance
2. Change `backgroundColor` for different background
3. Modify particle colors in the `createAmbientParticles()` function

### Performance Tuning

1. Adjust `pixelRatio` for different quality/performance balance
2. Modify particle count in `createAmbientParticles()`
3. Toggle `enablePostProcessing` for bloom effects

## 🌐 Deployment

### Netlify

1. **Drag and drop** the entire folder to [Netlify Drop](https://app.netlify.com/drop)
2. **Or connect** your Git repository to Netlify
3. **Set build command**: Leave empty (static site)
4. **Set publish directory**: `.` (root)
5. **Deploy!**

### Vercel

1. **Install Vercel CLI**: `npm i -g vercel`
2. **Navigate** to your project folder
3. **Run**: `vercel`
4. **Follow** the prompts
5. **Deploy!**

### GitHub Pages

1. **Push** your code to a GitHub repository
2. **Go to** repository Settings > Pages
3. **Select** source: Deploy from a branch
4. **Choose** main/master branch
5. **Save** and wait for deployment

### Traditional Web Hosting

1. **Upload** all files to your web server
2. **Ensure** the video file is accessible
3. **Test** in different browsers
4. **Optimize** video file size if needed

## 🔧 Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 12+)
- **Mobile**: Responsive design included

## 📱 Mobile Optimization

The experience is fully responsive and includes:
- Touch gesture support for parallax
- Optimized particle count for mobile
- Responsive text sizing
- Touch-friendly interactions

## 🎯 Performance Tips

1. **Optimize your video**:
   - Use H.264 codec
   - Compress to reasonable file size
   - Consider multiple resolutions for different devices

2. **Test on different devices**:
   - Desktop with high-end GPU
   - Mobile devices
   - Different screen sizes

3. **Monitor performance**:
   - Use browser dev tools
   - Check frame rate
   - Adjust particle count if needed

## 🐛 Troubleshooting

### Video not playing
- Check video file path
- Ensure video format is supported (MP4 recommended)
- Check browser autoplay policies
- Try with `muted` attribute

### Performance issues
- Reduce particle count
- Disable post-processing
- Lower pixel ratio
- Optimize video file

### Text not displaying
- Check browser WebGL support
- Verify Three.js is loading
- Check console for errors

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve this experience!

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the troubleshooting section
2. Look at the browser console for errors
3. Create an issue with details about your setup

---

**Enjoy your immersive AI experience! 🚀**