# Kros2U Landing Page

A modern, responsive landing page for Kros2U - a platform to connect all your apps in Vercel. Designed with a Korea Air inspired color scheme.

## Features

- Fully responsive design
- Modern UI/UX with smooth animations
- Korea Air inspired color scheme (deep blue, bright blue, orange accents)
- Sections for:
  - Hero section with value proposition
  - Features showcase
  - Supported apps display
  - How it works guide
  - Pricing plans
  - Testimonials
  - Call to action
  - Footer with links

## Technologies Used

- HTML5
- CSS3 (with modern features like CSS Grid and Flexbox)
- Vanilla JavaScript (for smooth scrolling and basic interactions)
- Responsive design principles

## File Structure

```
kros2u-landing-page/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── script.js           # Interactive elements
└── README.md           # This file
```

## Deployment to Vercel

To deploy this landing page to Vercel:

1. **Install Vercel CLI** (if you haven't already):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from the project directory**:
   ```bash
   vercel
   ```

4. **Follow the prompts** to configure your project:
   - Choose a project name (or use the default)
   - Confirm the directory to deploy (should be `./`)
   - Confirm the framework (choose "None" or "Other" since this is a static site)

5. **Verify deployment** - Vercel will provide you with a URL where your site is live.

## Customization

### Changing Colors
The color scheme is defined in the `:root` section of `styles.css`:
- `--primary-color`: Deep blue (Korea Air inspired)
- `--secondary-color`: Bright blue 
- `--accent-color`: Orange for highlights
- `--light-bg`: Light background color
- Adjust these variables to change the overall theme

### Adding/Removing Sections
Each section in `index.html` is clearly commented. To add or remove sections:
1. Copy/paste or delete the section HTML
2. Update the navigation links in the header if needed
3. Add corresponding styles in `styles.css` if creating new sections

### Updating Content
All text content is in `index.html` and can be easily modified:
- Headlines, paragraphs, button text, etc.
- App logos in the "Supported Apps" section
- Testimonials content
- Pricing plan details

## Browser Support

This landing page is compatible with all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Android Chrome)

## Performance Optimizations

- CSS is kept in a single file for simplicity
- Images are not used (all visuals are CSS-based or emoji/icons)
- Minimal JavaScript for better performance
- Responsive design ensures fast loading on mobile devices

## License

This project is open source and available for personal and commercial use.

---

Developed with ❤️ for Kros2U