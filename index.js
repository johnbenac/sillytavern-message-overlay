/**
 * Message Overlay Extension for SillyTavern
 * Shows messages in an in-app overlay panel (no popups)
 */

(function () {
  'use strict';

  const MODULE = 'message-overlay';
  const BTN_CLASS = 'stmo-btn';
  const ADDED_ATTR = 'data-stmo-ready';

  // Debug module - Enable with: localStorage.setItem('stmo_debug', 'true')
  const debug = {
    enabled: localStorage.getItem('stmo_debug') === 'true',
    log(...args) {
      if (this.enabled) console.log('[STMO Debug]', ...args);
    },
    table(data) {
      if (this.enabled) console.table(data);
    },
    group(label) {
      if (this.enabled) console.group(`[STMO Debug] ${label}`);
    },
    groupEnd() {
      if (this.enabled) console.groupEnd();
    },
    getViewport() {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        dvh: window.innerHeight * 0.01, // 1dvh equivalent
        breakpoint: window.innerWidth >= 1100 ? 'wide' : 'narrow',
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      };
    },
    getComputedInfo(element) {
      if (!element) return null;
      const styles = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        zIndex: styles.zIndex,
        position: styles.position,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        maxHeight: styles.maxHeight,
        transform: styles.transform,
        filter: styles.filter
      };
    }
  };

  // Single overlay instance
  let root, backdrop, panel, contentEl, headerTitle;
  let healthCheckInterval = null;

  function ensureOverlayRoot() {
    if (root) return root;
    
    debug.group('Creating overlay structure');
    debug.log('Initial viewport:', debug.getViewport());
    
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
    
    // Log computed styles after DOM insertion
    debug.log('Root computed styles:', debug.getComputedInfo(root));
    debug.log('Panel computed styles:', debug.getComputedInfo(panel));
    debug.log('Body computed styles:', {
      transform: getComputedStyle(document.body).transform,
      filter: getComputedStyle(document.body).filter,
      position: getComputedStyle(document.body).position
    });
    debug.groupEnd();

    // Event handlers for closing
    const hide = () => {
      debug.log('Hiding overlay via:', new Error().stack.split('\n')[2]);
      root.classList.add('stmo-hidden');
      clearInterval(healthCheckInterval);
    };
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

  function startHealthChecks() {
    // Clear any existing interval
    clearInterval(healthCheckInterval);
    
    if (!debug.enabled) return;
    
    let checkCount = 0;
    healthCheckInterval = setInterval(() => {
      if (!root || root.classList.contains('stmo-hidden')) {
        debug.log('Health check stopped - overlay hidden');
        clearInterval(healthCheckInterval);
        return;
      }
      
      checkCount++;
      debug.group(`Health check #${checkCount}`);
      debug.log('Viewport:', debug.getViewport());
      debug.log('Root visible:', !root.classList.contains('stmo-hidden'));
      debug.log('Root rect:', root.getBoundingClientRect());
      debug.log('Panel rect:', panel.getBoundingClientRect());
      
      // Check for potential issues
      const rootStyles = debug.getComputedInfo(root);
      const panelStyles = debug.getComputedInfo(panel);
      
      if (rootStyles.display === 'none' || rootStyles.visibility === 'hidden') {
        debug.log('⚠️ Root element hidden via CSS!');
      }
      if (panelStyles.height === 0) {
        debug.log('⚠️ Panel has zero height!');
      }
      if (parseInt(rootStyles.zIndex) < 2147483647) {
        debug.log('⚠️ Z-index changed from expected value!');
      }
      
      // Check parent transforms
      let parent = root.parentElement;
      while (parent && parent !== document.body) {
        const parentStyle = getComputedStyle(parent);
        if (parentStyle.transform !== 'none') {
          debug.log('⚠️ Parent has transform:', parent, parentStyle.transform);
        }
        parent = parent.parentElement;
      }
      
      debug.groupEnd();
    }, 500);
  }

  function showOverlay(title, html) {
    ensureOverlayRoot();
    const { DOMPurify } = (window.SillyTavern?.libs) || {};
    
    debug.group('Showing overlay');
    debug.log('Viewport:', debug.getViewport());
    debug.log('Title:', title);
    
    headerTitle.textContent = title || 'Message';
    contentEl.innerHTML = DOMPurify ? DOMPurify.sanitize(html) : html;
    root.classList.remove('stmo-hidden');
    
    // Log visibility state after showing
    setTimeout(() => {
      debug.log('After show - Root computed:', debug.getComputedInfo(root));
      debug.log('After show - Panel computed:', debug.getComputedInfo(panel));
      debug.log('Is visible:', !root.classList.contains('stmo-hidden'));
      debug.groupEnd();
      
      // Start health checks
      startHealthChecks();
    }, 50);
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
    
    // Add resize monitoring
    let resizeTimeout;
    const lastViewport = { width: window.innerWidth, breakpoint: '' };
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const viewport = debug.getViewport();
        const breakpointChanged = (lastViewport.width < 1100 && viewport.width >= 1100) || 
                                 (lastViewport.width >= 1100 && viewport.width < 1100);
        
        debug.group('Resize event');
        debug.log('Previous:', lastViewport);
        debug.log('Current:', viewport);
        debug.log('Breakpoint changed:', breakpointChanged);
        
        if (root && !root.classList.contains('stmo-hidden')) {
          debug.log('Overlay visible during resize');
          debug.log('Root styles:', debug.getComputedInfo(root));
          debug.log('Panel styles:', debug.getComputedInfo(panel));
          
          // Keep the overlay as the last child of <body> to outstack theme overlays
          document.body.appendChild(root);

          // Nudge the panel to reflow without replaying the animation
          panel.style.animation = 'none';
          void panel.offsetHeight; // force reflow
          panel.style.animation = '';
        }
        debug.groupEnd();
        
        lastViewport.width = viewport.width;
        lastViewport.breakpoint = viewport.breakpoint;
      }, 100);
    });
    
    // Register event listeners
    eventSource.on(event_types.APP_READY, enhanceAll);
    eventSource.on(event_types.USER_MESSAGE_RENDERED, enhanceAll);
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, enhanceAll);
    eventSource.on(event_types.CHAT_CHANGED, () => {
      // Hide overlay on chat change
      const overlay = document.getElementById('stmo-root');
      if (overlay) overlay.classList.add('stmo-hidden');
      clearInterval(healthCheckInterval);
      setTimeout(enhanceAll, 100);
    });

    // Initial enhancement
    enhanceAll();
    console.log('[Message Overlay] Extension loaded successfully');
    if (debug.enabled) {
      console.log('[STMO Debug] Debug mode enabled. Disable with: localStorage.removeItem("stmo_debug")');
    }
    
    // Keep overlay on top when body classes mutate (theme/layout flips)
    new MutationObserver(() => {
      if (root && !root.classList.contains('stmo-hidden')) {
        document.body.appendChild(root);
      }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
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
  
  // Expose debug toggle for console access
  window.stmoDebug = {
    enable() {
      localStorage.setItem('stmo_debug', 'true');
      debug.enabled = true;
      console.log('[STMO Debug] Enabled. Reload page to see full debug output.');
    },
    disable() {
      localStorage.removeItem('stmo_debug');
      debug.enabled = false;
      console.log('[STMO Debug] Disabled.');
    },
    status() {
      console.log('[STMO Debug] Status:', debug.enabled ? 'ENABLED' : 'DISABLED');
      if (root) {
        console.log('Overlay exists:', true);
        console.log('Overlay visible:', !root.classList.contains('stmo-hidden'));
        console.log('Current viewport:', debug.getViewport());
        console.log('Root styles:', debug.getComputedInfo(root));
        console.log('Panel styles:', debug.getComputedInfo(panel));
      } else {
        console.log('Overlay exists:', false);
      }
    }
  };
})();