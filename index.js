/**
 * Message Overlay Extension for SillyTavern
 * Shows messages in an in-app overlay panel (no popups)
 */

(function () {
  'use strict';

  const MODULE = 'message-overlay';
  const BTN_CLASS = 'stmo-btn';
  const ADDED_ATTR = 'data-stmo-ready';

  // Single overlay instance
  let root, backdrop, panel, contentEl, headerTitle;

  function ensureOverlayRoot() {
    if (root) return root;
    
    // Create overlay structure
    root = document.createElement('div');
    root.id = 'stmo-root';
    root.className = 'stmo stmo-hidden';

    backdrop = document.createElement('div');
    backdrop.className = 'stmo-backdrop';

    panel = document.createElement('div');
    panel.className = 'stmo-panel';
    panel.innerHTML = `
      <div class="stmo-header">
        <div class="stmo-title"></div>
        <div class="stmo-actions">
          <button class="stmo-close" title="Close">✕</button>
        </div>
      </div>
      <div class="stmo-content mes_text"></div>
    `;

    headerTitle = panel.querySelector('.stmo-title');
    contentEl = panel.querySelector('.stmo-content');

    root.appendChild(backdrop);
    root.appendChild(panel);
    document.body.appendChild(root);

    // Event handlers for closing
    const hide = () => root.classList.add('stmo-hidden');
    backdrop.addEventListener('click', hide);
    panel.querySelector('.stmo-close').addEventListener('click', hide);
    
    // Escape key handler
    window.addEventListener('keydown', (e) => { 
      if (e.key === 'Escape' && !root.classList.contains('stmo-hidden')) {
        hide();
      }
    });

    return root;
  }

  function showOverlay(title, html) {
    ensureOverlayRoot();
    const { DOMPurify } = (window.SillyTavern?.libs) || {};
    
    headerTitle.textContent = title || 'Message';
    contentEl.innerHTML = DOMPurify ? DOMPurify.sanitize(html) : html;
    root.classList.remove('stmo-hidden');
  }

  function extractSpeaker(mesNode) {
    // Try various selectors used by different themes
    const selectors = [
      '.mes_author',
      '.name_text',
      '.avatar-and-name .name',
      '.author-name',
      '.ch_name',
      '.mes_name'
    ];
    
    for (const selector of selectors) {
      const name = mesNode.querySelector(selector);
      if (name) return name.textContent.trim();
    }
    
    return '';
  }

  function extractHtml(mesNode) {
    // Find message content
    const contentSelectors = [
      '.mes_text',
      '.message-text',
      '.mes_block'
    ];
    
    for (const selector of contentSelectors) {
      const el = mesNode.querySelector(selector);
      if (el) return el.innerHTML || el.textContent || '';
    }
    
    return '';
  }

  function makeButton() {
    const btn = document.createElement('div');
    // Match ST pattern exactly: mes_button + FA icon classes + interactable
    btn.className = 'mes_button stmo_overlay fa-solid fa-up-right-from-square interactable';
    btn.setAttribute('title', 'Show this message in an overlay');
    btn.setAttribute('tabindex', '0');
    // No innerHTML needed - Font Awesome handles the icon
    
    // Keyboard activation
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
    
    return btn;
  }

  function enhanceMessage(mesNode) {
    if (!mesNode || mesNode.getAttribute(ADDED_ATTR)) return;

    // Find action buttons container
    const buttonContainers = [
      '.mes_buttons',
      '.mes_actions',
      '.message-actions'
    ];
    
    let actions = null;
    for (const selector of buttonContainers) {
      actions = mesNode.querySelector(selector);
      if (actions) break;
    }
    
    if (!actions) {
      console.debug('[Message Overlay] No action container found');
      return;
    }

    const btn = makeButton();
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const speaker = extractSpeaker(mesNode);
      const html = extractHtml(mesNode);
      showOverlay(speaker || 'Message', html);
    });

    // Find the collapsible menu and add our button there
    const moreMenu = actions.querySelector(':scope > .extraMesButtons');
    if (moreMenu) {
      moreMenu.appendChild(btn);
    } else {
      // Fallback if no collapsible menu exists
      actions.appendChild(btn);
    }
    
    mesNode.setAttribute(ADDED_ATTR, '1');
  }

  function enhanceAll() {
    // Debounce rapid calls
    clearTimeout(enhanceAll.timeout);
    enhanceAll.timeout = setTimeout(() => {
      const messages = document.querySelectorAll('#chat .mes:not([data-stmo-ready])');
      messages.forEach(enhanceMessage);
    }, 50);
  }

  function setup() {
    const ctx = window.SillyTavern?.getContext?.();
    if (!ctx) {
      console.warn('[Message Overlay] SillyTavern context unavailable');
      return;
    }

    const { eventSource, event_types } = ctx;
    
    // Register event listeners
    eventSource.on(event_types.APP_READY, enhanceAll);
    eventSource.on(event_types.USER_MESSAGE_RENDERED, enhanceAll);
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, enhanceAll);
    eventSource.on(event_types.CHAT_CHANGED, () => {
      // Hide overlay on chat change
      const overlay = document.getElementById('stmo-root');
      if (overlay) overlay.classList.add('stmo-hidden');
      setTimeout(enhanceAll, 100);
    });

    // Initial enhancement
    enhanceAll();
    console.log('[Message Overlay] Extension loaded successfully');
  }

  // Initialize when SillyTavern is ready
  if (window.SillyTavern?.getContext) {
    const { eventSource, event_types } = window.SillyTavern.getContext();
    if (eventSource && event_types) {
      eventSource.on(event_types.APP_READY, setup);
    }
    // Fallback timeout
    setTimeout(() => { 
      if (!document.getElementById('stmo-root')) setup(); 
    }, 1500);
  } else {
    // Fallback for older versions
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup);
    } else {
      setTimeout(setup, 100);
    }
  }
})();