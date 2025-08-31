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
        try {
            const response = await fetch(`/scripts/extensions/${extensionName}/template.html`);
            const templateHtml = await response.text();
            
            // Check if template already exists
            if (!document.getElementById('message_overlay_template')) {
                document.body.insertAdjacentHTML('beforeend', templateHtml);
            }
        } catch (error) {
            console.error('[Message Overlay] Failed to load template:', error);
        }
    }

    /**
     * Show message overlay using the same pattern as zoomed avatars
     */
    function showMessageOverlay(messageElement) {
        const messageId = `msg_${messageIdCounter++}`;
        const speaker = extractSpeaker(messageElement);
        const content = extractContent(messageElement);
        
        // Check if overlay already exists for this message (use custom- prefix)
        if ($(`.custom-message_overlay[forMessage="${messageId}"]`).length) {
            console.debug('removing container as it already existed');
            $(`.custom-message_overlay[forMessage="${messageId}"]`).fadeOut(animation_duration, () => {
                $(`.custom-message_overlay[forMessage="${messageId}"]`).remove();
            });
        } else {
            console.debug('making new container from template');
            const template = $('#message_overlay_template').html();
            const newElement = $(template);
            
            // Set attributes like zoomed avatar does
            newElement.attr('forMessage', messageId);
            newElement.attr('id', `messageOverlay_${messageId}`);
            newElement.addClass('draggable');
            newElement.find('.custom-drag-grabber').attr('id', `messageOverlay_${messageId}header`);
            
            // Set content (SillyTavern adds custom- prefix to all classes)
            newElement.find('.custom-message_overlay_title').text(speaker || 'Message');
            newElement.find('.custom-message_overlay_content').html(content);
            
            // Append to body like zoomed avatars
            $('body').append(newElement);
            newElement.fadeIn(animation_duration);
            
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

    /**
     * Extract message content
     */
    function extractContent(mesNode) {
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
        if (!mesNode || mesNode.hasAttribute('data-message-overlay-ready')) return;

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
            showMessageOverlay(mesNode);
        });

        // Find the collapsible menu and add our button there
        const moreMenu = actions.querySelector(':scope > .extraMesButtons');
        if (moreMenu) {
            moreMenu.appendChild(btn);
        } else {
            // Fallback if no collapsible menu exists
            actions.appendChild(btn);
        }
        
        mesNode.setAttribute('data-message-overlay-ready', '1');
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
            // Get animation settings from main script
            const mainModule = await import('../../../script.js');
            animation_duration = mainModule.animation_duration || 200;
            animation_easing = mainModule.animation_easing || 'ease-in-out';
            
            // Get drag functions
            const modsModule = await import('../../RossAscends-mods.js');
            dragElement = modsModule.dragElement;
            
            // Get UI state functions
            const powerModule = await import('../../power-user.js');
            loadMovingUIState = powerModule.loadMovingUIState;
            power_user = powerModule.power_user;
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