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

1. Look for the ▣ button in any message's action buttons
2. Click to show message in the overlay
3. Close with:
   - ✕ button in header
   - Click backdrop
   - Press Escape key

## Compatibility

- **Minimum SillyTavern**: 1.10.0
- **Browsers**: All modern browsers (no popup requirements)
- **Themes**: Works with all SillyTavern themes

## Why This Over Pop-ups?

- No browser popup blockers
- Better integrated with SillyTavern UI
- Responsive to different screen sizes
- Follows SillyTavern's design patterns

## Technical Details

- Single overlay instance (reused for all messages)
- Event-driven enhancement via ST event bus
- DOMPurify sanitization when available
- Responsive breakpoint at 1100px width

## License

Open source - feel free to fork and modify!