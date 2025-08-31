# Message Overlay Extension for SillyTavern

Shows any chat message in a responsive in-app overlay—no browser pop-ups required. Works just like the avatar expansion feature: side panel on wide screens, full overlay on narrow screens.

## Features

- **In-App Overlay**: No popup blockers to worry about
- **Responsive Design**: 
  - Wide screens (≥1100px): Elegant side panel on the right
  - Narrow screens: Bottom sheet overlay
- **Clean UI**: Minimal ▣ button in message actions
- **Keyboard Support**: Press Esc to close
- **Click-away Dismissal**: Click backdrop to close
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

1. Look for the ▣ button in any message's action buttons (next to copy, TTS, etc.)
2. Click to show message in the overlay
3. Close with:
   - ✕ button in header
   - Click backdrop
   - Press Escape key
4. Only one message shown at a time (clicking another replaces current)

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

### Theme Integration
- Uses `mes_text` class to inherit SillyTavern's text styling
- Leverages theme variables:
  - `--SmartThemeQuoteColor` for quoted dialogue
  - `--SmartThemeEmColor` for emphasis/italics
- Compatible with dialogue colorizer extensions

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
- `style.css` - Responsive styles with theme integration (~240 lines)

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