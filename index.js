/**
 * Message Overlay Extension for SillyTavern
 * Uses the same pattern as zoomed avatars for consistency
 */

(function () {
    'use strict';

    const extensionName = 'message-overlay';
    let messageIdCounter = 0;
    let animation_duration = 200; // Default, will be overridden if available
    let animation_easing = 'ease-in-out';
    
    // These will be imported from ST if available
    let dragElement = null;
    let loadMovingUIState = null;
    let power_user = null;

    /**
     * Inject the template into the page
     */
    async function injectTemplate() {
        console.log('[Message Overlay] Attempting to inject template...');
        try {
            // Get the base URL of this script to handle both first-party and third-party installations
            const scripts = Array.from(document.scripts);
            const thisScript = scripts.find(s => s.src && s.src.includes('message-overlay'));
            let baseUrl = '';
            
            if (thisScript) {
                // Extract the directory path from the script URL
                const scriptUrl = new URL(thisScript.src);
                baseUrl = scriptUrl.pathname.substring(0, scriptUrl.pathname.lastIndexOf('/'));
                console.log('[Message Overlay] Detected script base URL:', baseUrl);
            } else {
                // Fallback to default path
                baseUrl = `/scripts/extensions/${extensionName}`;
                console.log('[Message Overlay] Using fallback base URL:', baseUrl);
            }
            
            const templateUrl = `${baseUrl}/template.html`;
            console.log('[Message Overlay] Fetching template from:', templateUrl);
            
            const response = await fetch(templateUrl);
            console.log('[Message Overlay] Template fetch response:', response.status, response.statusText);
            
            const templateHtml = await response.text();
            console.log('[Message Overlay] Template HTML length:', templateHtml.length);
            console.log('[Message Overlay] Template HTML preview:', templateHtml.substring(0, 100) + '...');
            
            // Check if template already exists
            if (!document.getElementById('message_overlay_template')) {
                console.log('[Message Overlay] Injecting template into body...');
                document.body.insertAdjacentHTML('beforeend', templateHtml);
                
                // Verify injection
                const injected = document.getElementById('message_overlay_template');
                console.log('[Message Overlay] Template injected successfully:', !!injected);
                if (injected) {
                    console.log('[Message Overlay] Injected template HTML:', injected.innerHTML.substring(0, 100) + '...');
                }
            } else {
                console.log('[Message Overlay] Template already exists in DOM');
            }
        } catch (error) {
            console.error('[Message Overlay] Failed to load template:', error);
        }
    }

    /**
     * Show message overlay using the same pattern as zoomed avatars
     */
    function showMessageOverlay(messageElement) {
        console.log('[Message Overlay] showMessageOverlay called');
        console.log('[Message Overlay] messageElement:', messageElement);
        
        const messageId = `msg_${messageIdCounter++}`;
        console.log('[Message Overlay] Generated messageId:', messageId);
        
        const speaker = extractSpeaker(messageElement);
        console.log('[Message Overlay] Extracted speaker:', speaker);
        
        const content = extractContent(messageElement);
        console.log('[Message Overlay] Extracted content length:', content?.length || 0);
        console.log('[Message Overlay] Content preview:', content?.substring(0, 100) + '...');
        
        // Check if overlay already exists for this message (use custom- prefix)
        const existingOverlay = $(`.custom-message_overlay[forMessage="${messageId}"]`);
        console.log('[Message Overlay] Checking for existing overlay:', existingOverlay.length);
        
        if (existingOverlay.length) {
            console.debug('removing container as it already existed');
            existingOverlay.fadeOut(animation_duration, () => {
                existingOverlay.remove();
            });
        } else {
            console.debug('making new container from template');
            
            // Check if template exists
            const templateElement = $('#message_overlay_template');
            console.log('[Message Overlay] Template element found:', templateElement.length > 0);
            
            const template = templateElement.html();
            console.log('[Message Overlay] Template HTML exists:', !!template);
            console.log('[Message Overlay] Template HTML length:', template?.length || 0);
            
            if (!template) {
                console.error('[Message Overlay] Template HTML is empty or undefined!');
                return;
            }
            
            const newElement = $(template);
            console.log('[Message Overlay] New element created:', newElement.length);
            console.log('[Message Overlay] New element HTML:', newElement.prop('outerHTML')?.substring(0, 200) + '...');
            
            // Set attributes like zoomed avatar does
            newElement.attr('forMessage', messageId);
            newElement.attr('id', `messageOverlay_${messageId}`);
            newElement.addClass('draggable');
            newElement.find('.custom-drag-grabber').attr('id', `messageOverlay_${messageId}header`);
            
            // Set content (SillyTavern adds custom- prefix to all classes)
            const titleElement = newElement.find('.custom-message_overlay_title');
            console.log('[Message Overlay] Title element found:', titleElement.length);
            titleElement.text(speaker || 'Message');
            
            const contentElement = newElement.find('.custom-message_overlay_content');
            console.log('[Message Overlay] Content element found:', contentElement.length);
            contentElement.html(content);
            
            // Log the element before appending
            console.log('[Message Overlay] Element before append:', newElement.prop('outerHTML')?.substring(0, 200) + '...');
            
            // Append to body like zoomed avatars
            console.log('[Message Overlay] Appending to body...');
            $('body').append(newElement);
            
            // Check if it was actually appended
            const appended = $(`#messageOverlay_${messageId}`);
            console.log('[Message Overlay] Element found in DOM after append:', appended.length);
            
            console.log('[Message Overlay] Starting fadeIn animation...');
            newElement.fadeIn(animation_duration, function() {
                console.log('[Message Overlay] FadeIn complete');
            });
            
            // Load moving UI state if available
            if (loadMovingUIState) {
                loadMovingUIState();
            }
            
            // Make draggable if available
            $(`.custom-message_overlay[forMessage="${messageId}"]`).css('display', 'block');
            if (dragElement) {
                dragElement(newElement);
            }
            
            // Handle close button (use custom- prefix)
            $('.custom-message_overlay .custom-dragClose, .custom-message_overlay').on('click touchend', (e) => {
                if (e.target.closest('.custom-dragClose') || e.target.classList.contains('custom-zoomed_avatar')) {
                    $(`.custom-message_overlay[forMessage="${messageId}"]`).fadeOut(animation_duration, () => {
                        $(`.custom-message_overlay[forMessage="${messageId}"]`).remove();
                    });
                }
            });
            
            // Prevent dragging on content
            newElement.find('.custom-message_overlay_content').on('dragstart', (e) => {
                console.log('preventing drag on message content');
                e.preventDefault();
                return false;
            });
        }
    }

    /**
     * Extract speaker name from message element
     */
    function extractSpeaker(mesNode) {
        console.log('[Message Overlay] extractSpeaker called');
        
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
            console.log(`[Message Overlay] Trying speaker selector: ${selector}`);
            const name = mesNode.querySelector(selector);
            if (name) {
                const speakerName = name.textContent.trim();
                console.log(`[Message Overlay] Found speaker with ${selector}:`, speakerName);
                return speakerName;
            }
        }
        
        console.log('[Message Overlay] No speaker name found');
        return '';
    }

    /**
     * Extract message content
     */
    function extractContent(mesNode) {
        console.log('[Message Overlay] extractContent called');
        
        // Find message content
        const contentSelectors = [
            '.mes_text',
            '.message-text',
            '.mes_block'
        ];
        
        for (const selector of contentSelectors) {
            console.log(`[Message Overlay] Trying content selector: ${selector}`);
            const el = mesNode.querySelector(selector);
            if (el) {
                const html = el.innerHTML;
                const text = el.textContent;
                console.log(`[Message Overlay] Found content with ${selector}`);
                console.log(`[Message Overlay] HTML length: ${html?.length || 0}, Text length: ${text?.length || 0}`);
                return html || text || '';
            }
        }
        
        console.log('[Message Overlay] No content found!');
        return '';
    }

    /**
     * Create overlay button matching ST's style
     */
    function makeButton() {
        const btn = document.createElement('div');
        // Match ST pattern exactly: mes_button + FA icon classes + interactable
        btn.className = 'mes_button stmo_overlay fa-solid fa-up-right-from-square interactable';
        btn.setAttribute('title', 'Show this message in an overlay');
        btn.setAttribute('tabindex', '0');
        
        // Keyboard activation
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
        
        return btn;
    }

    /**
     * Enhance a message with the overlay button
     */
    function enhanceMessage(mesNode) {
        if (!mesNode) {
            console.log('[Message Overlay] enhanceMessage called with null node');
            return;
        }
        
        if (mesNode.hasAttribute('data-message-overlay-ready')) {
            console.log('[Message Overlay] Message already enhanced, skipping');
            return;
        }

        console.log('[Message Overlay] Enhancing message:', mesNode);

        // Find action buttons container
        const buttonContainers = [
            '.mes_buttons',
            '.mes_actions',
            '.message-actions'
        ];
        
        let actions = null;
        for (const selector of buttonContainers) {
            console.log(`[Message Overlay] Looking for button container: ${selector}`);
            actions = mesNode.querySelector(selector);
            if (actions) {
                console.log(`[Message Overlay] Found button container with selector: ${selector}`);
                break;
            }
        }
        
        if (!actions) {
            console.debug('[Message Overlay] No action container found');
            return;
        }

        const btn = makeButton();
        console.log('[Message Overlay] Button created:', btn);
        
        btn.addEventListener('click', (e) => {
            console.log('[Message Overlay] Button clicked!');
            e.stopPropagation();
            showMessageOverlay(mesNode);
        });

        // Find the collapsible menu and add our button there
        const moreMenu = actions.querySelector(':scope > .extraMesButtons');
        console.log('[Message Overlay] Looking for extraMesButtons:', !!moreMenu);
        
        if (moreMenu) {
            console.log('[Message Overlay] Adding button to extraMesButtons menu');
            moreMenu.appendChild(btn);
        } else {
            console.log('[Message Overlay] No extraMesButtons found, adding to main actions');
            actions.appendChild(btn);
        }
        
        mesNode.setAttribute('data-message-overlay-ready', '1');
        console.log('[Message Overlay] Message enhancement complete');
    }

    /**
     * Enhance all messages
     */
    function enhanceAll() {
        // Debounce rapid calls
        clearTimeout(enhanceAll.timeout);
        enhanceAll.timeout = setTimeout(() => {
            const messages = document.querySelectorAll('#chat .mes:not([data-message-overlay-ready])');
            messages.forEach(enhanceMessage);
        }, 50);
    }

    /**
     * Setup the extension
     */
    async function setup() {
        const ctx = window.SillyTavern?.getContext?.();
        if (!ctx) {
            console.warn('[Message Overlay] SillyTavern context unavailable');
            return;
        }

        const { eventSource, event_types } = ctx;
        
        // Try to get functions from ST modules
        try {
            console.log('[Message Overlay] Attempting to import ST modules...');
            
            // Get animation settings from main script
            console.log('[Message Overlay] Importing main script...');
            const mainModule = await import('../../../script.js');
            animation_duration = mainModule.animation_duration || 200;
            animation_easing = mainModule.animation_easing || 'ease-in-out';
            console.log('[Message Overlay] Animation settings:', animation_duration, animation_easing);
            
            // Get drag functions
            console.log('[Message Overlay] Importing RossAscends-mods...');
            const modsModule = await import('../../RossAscends-mods.js');
            dragElement = modsModule.dragElement;
            console.log('[Message Overlay] dragElement function available:', !!dragElement);
            
            // Get UI state functions
            console.log('[Message Overlay] Importing power-user...');
            const powerModule = await import('../../power-user.js');
            loadMovingUIState = powerModule.loadMovingUIState;
            power_user = powerModule.power_user;
            console.log('[Message Overlay] loadMovingUIState available:', !!loadMovingUIState);
            console.log('[Message Overlay] power_user available:', !!power_user);
        } catch (error) {
            console.warn('[Message Overlay] Some ST modules not available:', error);
            // Extension will work without dragging functionality
        }
        
        // Inject template
        await injectTemplate();
        
        // Remove all overlays when chat changes
        eventSource.on(event_types.CHAT_CHANGED, () => {
            $('.custom-message_overlay').fadeOut(animation_duration, function() {
                $(this).remove();
            });
            setTimeout(enhanceAll, 100);
        });
        
        // Register event listeners
        eventSource.on(event_types.APP_READY, enhanceAll);
        eventSource.on(event_types.USER_MESSAGE_RENDERED, enhanceAll);
        eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, enhanceAll);
        
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
            if (!document.getElementById('message_overlay_template')) setup(); 
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