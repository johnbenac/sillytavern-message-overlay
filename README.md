# Message Overlay Extension for SillyTavern

Shows any chat message in a draggable overlay window—no browser pop-ups required. Uses the exact same pattern as SillyTavern's zoomed avatars, making it fully consistent with the UI.

## Features

- **Draggable Window**: Move it anywhere on screen, just like zoomed avatars
- **Persistent Position**: Remembers where you placed it (if movingUI is enabled)
- **In-App Overlay**: No popup blockers to worry about
- **Clean UI**: Font Awesome ↗ icon in the collapsible message menu
- **Click to Close**: Click the X button or outside the overlay
- **Theme Aware**: Adapts to light/dark themes
- **Live Updates**: Message content stays current if edited
- **Quote & Emphasis Colors**: Preserves colored quotes and italic emphasis from themes

## Installation

### Via Git URL (Recommended)

1. Open SillyTavern
2. Go to **Extensions** → **Install extension**
3. Enter: `https://gitlab.benac.dev/tools/sillytavern-message-overlay`
4. Enable the extension

### Manual Installation

1. Clone to your extensions folder:
   ```bash
   cd SillyTavern/data/<user>/extensions/
   git clone https://gitlab.benac.dev/tools/sillytavern-message-overlay message-overlay-extension
   ```

2. Reload SillyTavern and enable in Extensions menu

## Usage

1. Click the three dots (...) menu on any message to expand additional actions
2. Look for the ↗ icon (up-right arrow) in the expanded menu
3. Click the icon to show that message in the overlay
4. Close the overlay with:
   - ✕ button in header
   - Click backdrop
   - Press Escape key
5. Only one message shown at a time (clicking another replaces current)

## Screenshots

### Desktop View (Wide Screen)
When your window is ≥1100px wide, the overlay appears as a side panel:
- Docked to the right side
- Takes up ~520px width
- Full height with rounded corners
- Chat remains visible and interactive

### Mobile/Narrow View
When your window is <1100px wide, the overlay appears as a bottom sheet:
- Slides up from bottom
- Maximum 85% screen height
- Full width with top rounded corners
- Familiar mobile app pattern

## Compatibility

- **Minimum SillyTavern**: 1.10.0
- **Browsers**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **Themes**: Tested with Default, Holinight, Mobile themes
- **Platforms**: Desktop and mobile responsive

## Why This Over Pop-ups?

Browser popup blockers have become extremely aggressive. Even legitimate user-initiated popups get blocked by default in Chrome and Firefox. This creates a poor user experience requiring users to:
1. See "popup blocked" notification
2. Find browser settings
3. Add exception for SillyTavern
4. Reload and try again

The overlay approach:
- **Always works** - no browser configuration needed
- **Better UX** - integrated with SillyTavern's interface
- **Responsive** - adapts to screen size automatically
- **Consistent** - matches avatar preview behavior

## Technical Architecture

### Event Integration
The extension hooks into SillyTavern's event system:
```javascript
APP_READY → Initial enhancement of existing messages
MESSAGE_RENDERED → Enhance newly added messages
CHAT_CHANGED → Clean up and re-enhance
```

### DOM Strategy
- Single overlay instance (reused for efficiency)
- Idempotent enhancement (safe to call multiple times)
- Minimal DOM mutations (performance optimized)
- Scoped selectors (theme compatible)
- Button placement in `.extraMesButtons` (collapsible menu)

### Theme Integration
- Uses `mes_text` class to inherit SillyTavern's text styling
- Leverages theme variables:
  - `--SmartThemeQuoteColor` for quoted dialogue
  - `--SmartThemeEmColor` for emphasis/italics
- Compatible with dialogue colorizer extensions
- Button uses Font Awesome icons and ST's built-in `.mes_button` styling

### Security
- DOMPurify sanitization when available
- No eval or dynamic code execution
- Follows SillyTavern security practices

### Performance
- Debounced enhancement (50ms)
- Event-driven, not polling
- Minimal memory footprint
- Automatic cleanup on chat switch

## Development

Source code: https://gitlab.benac.dev/tools/sillytavern-message-overlay

Key files:
- `manifest.json` - Extension metadata
- `index.js` - Core functionality (~200 lines)
- `style.css` - Responsive styles for overlay panel (~200 lines)

See `/opt/centroid-tools/sillytavern/DEVELOPMENT.md` for technical details.

## Troubleshooting

**Button not appearing?**
- Check that extension is enabled in Extensions menu
- Try refreshing the page (F5)
- Check browser console for errors

**Overlay not showing?**
- Ensure JavaScript is enabled
- Check for conflicting extensions
- Try disabling other UI modification extensions

**Theme issues?**
- Report specific theme name and issue
- Most themes are supported automatically

### Debug Mode

If you're experiencing issues with the overlay (especially on mobile/narrow viewports), enable debug mode:

1. Open browser console (F12)
2. Enable debug mode: `stmoDebug.enable()`
3. Reload the page
4. Try to reproduce the issue
5. Check console for detailed debug output including:
   - Viewport dimensions and breakpoints
   - Computed styles (z-index, visibility, dimensions)
   - Resize events and breakpoint changes
   - Health checks every 500ms while overlay is visible
   - Parent element transforms that might affect positioning

**Debug commands:**
- `stmoDebug.enable()` - Turn on debug logging
- `stmoDebug.disable()` - Turn off debug logging  
- `stmoDebug.status()` - Check current overlay state

Debug logs will show warnings (⚠️) for common issues like zero height, visibility problems, or z-index conflicts.

## Future Ideas

- Settings panel for customization
- Font size adjustment
- Position preferences (left/right)
- Multi-message support
- Export message content
- Pin/follow specific speakers

## Credits

Developed by Johnny & Assistant for the SillyTavern community.

## License

Open source - feel free to fork and modify!