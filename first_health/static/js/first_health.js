/**
 * ============================================
 * First Health - Main JavaScript Application
 * ============================================
 * 
 * OOP-based application with jQuery, AJAX utilities,
 * and integration with Tailwind CSS components
 */

(function($) {
    'use strict';

    /**
     * Main Application Class
     */
    class FirstHealthApp {
        constructor() {
            this.config = {
                csrfToken: this.getCSRFToken(),
                apiBaseUrl: '/api/',
                defaultTimeout: 30000,
                scrollOffset: 80
            };
            
            this.ui = new UIManager();
            this.ajax = new AjaxManager(this.config);
            this.forms = new FormManager(this.ajax);
            this.theme = new ThemeManager();
            this.swal = new SweetAlert2Manager();
            
            this.init();
        }

        /**
         * Initialize the application
         */
        init() {
            console.log('First Health App Initializing...');
            
            // Initialize all modules
            this.ui.init();
            this.theme.init();
            this.forms.init();
            
            // Setup global event listeners
            this.setupGlobalListeners();
            
            console.log('First Health App Ready!');
        }

        /**
         * Get CSRF token from cookies
         */
        getCSRFToken() {
            const name = 'csrftoken';
            let cookieValue = null;
            
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            
            return cookieValue;
        }

        /**
         * Setup global event listeners
         */
        setupGlobalListeners() {
            // Smooth scroll for anchor links
            $('a[href^="#"]').on('click', (e) => {
                const href = $(e.currentTarget).attr('href');
                if (href !== '#' && href.length > 1) {
                    e.preventDefault();
                    this.ui.smoothScroll(href);
                }
            });

            // Close alerts on click
            $(document).on('click', '[data-dismiss="alert"]', function() {
                $(this).closest('.alert').fadeOut(300, function() {
                    $(this).remove();
                });
            });

            // Handle button loading states
            $(document).on('ajax:before', '[data-loading]', function() {
                $(this).addClass('loading').prop('disabled', true);
            });

            $(document).on('ajax:complete', '[data-loading]', function() {
                $(this).removeClass('loading').prop('disabled', false);
            });
        }
    }

    /**
     * UI Manager - Handles UI interactions and animations
     */
    class UIManager {
        constructor() {
            this.notificationQueue = [];
            this.isProcessingNotification = false;
        }

        /**
         * Initialize UI components
         */
        init() {
            this.initScrollEffects();
            this.initTooltips();
            this.initModals();
            this.initAnimations();
        }

        /**
         * Initialize scroll effects
         */
        initScrollEffects() {
            let lastScroll = 0;
            
            $(window).on('scroll', () => {
                const currentScroll = $(window).scrollTop();
                
                // Add/remove scrolled class to header
                if (currentScroll > 50) {
                    $('header, .navbar').addClass('scrolled');
                } else {
                    $('header, .navbar').removeClass('scrolled');
                }
                
                lastScroll = currentScroll;
            });
        }

        /**
         * Initialize tooltips
         */
        initTooltips() {
            $('[data-tooltip]').each(function() {
                const $el = $(this);
                const text = $el.data('tooltip');
                
                $el.on('mouseenter', function() {
                    const tooltip = $('<div class="tooltip"></div>')
                        .text(text)
                        .css({
                            position: 'absolute',
                            zIndex: 9999
                        });
                    
                    $('body').append(tooltip);
                    
                    const offset = $el.offset();
                    tooltip.css({
                        top: offset.top - tooltip.outerHeight() - 8,
                        left: offset.left + ($el.outerWidth() / 2) - (tooltip.outerWidth() / 2)
                    });
                });
                
                $el.on('mouseleave', function() {
                    $('.tooltip').remove();
                });
            });
        }

        /**
         * Initialize modals
         */
        initModals() {
            // Open modal
            $(document).on('click', '[data-modal-open]', function(e) {
                e.preventDefault();
                const target = $(this).data('modal-open');
                $(`#${target}`).fadeIn(200).addClass('active');
                $('body').addClass('overflow-hidden');
            });

            // Close modal
            $(document).on('click', '[data-modal-close], .modal-backdrop', function(e) {
                if (e.target === this) {
                    $(this).closest('.modal').fadeOut(200).removeClass('active');
                    $('body').removeClass('overflow-hidden');
                }
            });

            // ESC key to close modal
            $(document).on('keyup', (e) => {
                if (e.key === 'Escape') {
                    $('.modal.active').fadeOut(200).removeClass('active');
                    $('body').removeClass('overflow-hidden');
                }
            });
        }

        /**
         * Initialize scroll animations
         */
        initAnimations() {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        $(entry.target).addClass('animate-slide-up');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            $('[data-animate]').each(function() {
                observer.observe(this);
            });
        }

        /**
         * Smooth scroll to element
         */
        smoothScroll(target, offset = 80) {
            const $target = $(target);
            
            if ($target.length) {
                $('html, body').animate({
                    scrollTop: $target.offset().top - offset
                }, 600, 'swing');
            }
        }

        /**
         * Show notification
         */
        notify(message, type = 'info', duration = 5000) {
            const notification = {
                id: Date.now(),
                message,
                type,
                duration
            };

            this.notificationQueue.push(notification);
            
            if (!this.isProcessingNotification) {
                this.processNotificationQueue();
            }
        }

        /**
         * Process notification queue
         */
        processNotificationQueue() {
            if (this.notificationQueue.length === 0) {
                this.isProcessingNotification = false;
                return;
            }

            this.isProcessingNotification = true;
            const notification = this.notificationQueue.shift();
            
            const alertClass = `alert-${notification.type}`;
            const icons = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ'
            };
            
            const $alert = $(`
                <div class="alert ${alertClass} fixed top-4 right-4 z-50 min-w-[300px] max-w-md animate-slide-down" 
                     role="alert" 
                     style="display: none;">
                    <div class="flex items-start gap-3">
                        <span class="text-lg font-bold">${icons[notification.type]}</span>
                        <div class="flex-1">
                            <p class="alert-description">${notification.message}</p>
                        </div>
                        <button type="button" 
                                class="text-current opacity-70 hover:opacity-100" 
                                data-dismiss="alert">
                            ✕
                        </button>
                    </div>
                </div>
            `);
            
            $('body').append($alert);
            $alert.fadeIn(200);
            
            if (notification.duration > 0) {
                setTimeout(() => {
                    $alert.fadeOut(300, function() {
                        $(this).remove();
                        setTimeout(() => {
                            this.processNotificationQueue();
                        }, 100);
                    }.bind(this));
                }, notification.duration);
            }
        }

        /**
         * Show loading indicator
         */
        showLoading(target = 'body') {
            const $target = $(target);
            const $loader = $(`
                <div class="loading-overlay fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-xl">
                        <div class="animate-pulse-slow text-primary text-2xl">
                            <span class="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                        </div>
                        <p class="mt-4 text-sm text-muted-foreground">Loading...</p>
                    </div>
                </div>
            `);
            
            $target.append($loader);
            return $loader;
        }

        /**
         * Hide loading indicator
         */
        hideLoading($loader = null) {
            if ($loader) {
                $loader.fadeOut(200, function() {
                    $(this).remove();
                });
            } else {
                $('.loading-overlay').fadeOut(200, function() {
                    $(this).remove();
                });
            }
        }
    }

    /**
     * AJAX Manager - Handles all AJAX requests
     */
    class AjaxManager {
        constructor(config) {
            this.config = config;
            this.setupDefaults();
        }

        /**
         * Setup jQuery AJAX defaults
         */
        setupDefaults() {
            $.ajaxSetup({
                headers: {
                    'X-CSRFToken': this.config.csrfToken
                },
                timeout: this.config.defaultTimeout,
                contentType: 'application/json',
                dataType: 'json'
            });
        }

        /**
         * Generic AJAX request handler
         */
        async request(url, options = {}) {
            const defaults = {
                method: 'GET',
                data: null,
                headers: {},
                showLoading: false,
                showNotification: true
            };

            const settings = { ...defaults, ...options };
            
            let $loader = null;
            if (settings.showLoading) {
                $loader = window.app.ui.showLoading();
            }

            try {
                const ajaxOptions = {
                    url: url,
                    method: settings.method,
                    headers: settings.headers
                };

                if (settings.data) {
                    if (settings.method === 'GET') {
                        ajaxOptions.data = settings.data;
                    } else {
                        ajaxOptions.data = JSON.stringify(settings.data);
                    }
                }

                const response = await $.ajax(ajaxOptions);
                
                if (settings.showLoading) {
                    window.app.ui.hideLoading($loader);
                }

                if (settings.showNotification && response.message) {
                    window.app.ui.notify(response.message, 'success');
                }

                return {
                    success: true,
                    data: response
                };

            } catch (error) {
                if (settings.showLoading) {
                    window.app.ui.hideLoading($loader);
                }

                const errorMessage = error.responseJSON?.message || 
                                   error.statusText || 
                                   'An error occurred. Please try again.';

                if (settings.showNotification) {
                    window.app.ui.notify(errorMessage, 'error');
                }

                console.error('AJAX Error:', error);

                return {
                    success: false,
                    error: errorMessage,
                    details: error
                };
            }
        }

        /**
         * GET request
         */
        async get(url, params = {}, options = {}) {
            return this.request(url, {
                method: 'GET',
                data: params,
                ...options
            });
        }

        /**
         * POST request
         */
        async post(url, data = {}, options = {}) {
            return this.request(url, {
                method: 'POST',
                data: data,
                ...options
            });
        }

        /**
         * PUT request
         */
        async put(url, data = {}, options = {}) {
            return this.request(url, {
                method: 'PUT',
                data: data,
                ...options
            });
        }

        /**
         * PATCH request
         */
        async patch(url, data = {}, options = {}) {
            return this.request(url, {
                method: 'PATCH',
                data: data,
                ...options
            });
        }

        /**
         * DELETE request
         */
        async delete(url, options = {}) {
            return this.request(url, {
                method: 'DELETE',
                ...options
            });
        }
    }

    /**
     * Form Manager - Handles form submissions and validation
     */
    class FormManager {
        constructor(ajaxManager) {
            this.ajax = ajaxManager;
        }

        /**
         * Initialize form handlers
         */
        init() {
            this.setupFormSubmission();
            this.setupFormValidation();
        }

        /**
         * Setup AJAX form submission
         */
        setupFormSubmission() {
            $(document).on('submit', 'form[data-ajax]', async (e) => {
                e.preventDefault();
                
                const $form = $(e.currentTarget);
                const url = $form.attr('action') || window.location.href;
                const method = $form.attr('method')?.toUpperCase() || 'POST';
                
                // Get form data
                const formData = this.serializeForm($form);
                
                // Disable form during submission
                $form.find('button[type="submit"]').prop('disabled', true).addClass('loading');
                
                try {
                    const response = await this.ajax.request(url, {
                        method: method,
                        data: formData,
                        showNotification: true
                    });

                    if (response.success) {
                        // Trigger custom event
                        $form.trigger('ajax:success', [response.data]);
                        
                        // Optionally redirect
                        if (response.data.redirect) {
                            window.location.href = response.data.redirect;
                        }
                        
                        // Optionally reset form
                        if ($form.data('reset-on-success')) {
                            $form[0].reset();
                        }
                    } else {
                        $form.trigger('ajax:error', [response.error]);
                        this.displayFormErrors($form, response.details?.responseJSON?.errors);
                    }
                } finally {
                    $form.find('button[type="submit"]').prop('disabled', false).removeClass('loading');
                }
            });
        }

        /**
         * Setup client-side form validation
         */
        setupFormValidation() {
            $(document).on('blur', 'input[required], textarea[required]', function() {
                const $input = $(this);
                const $formGroup = $input.closest('.form-group');
                
                if (!$input.val()) {
                    $formGroup.addClass('error');
                    if (!$formGroup.find('.error-message').length) {
                        $formGroup.append(`
                            <span class="error-message text-sm text-red-500 mt-1 block">
                                This field is required.
                            </span>
                        `);
                    }
                } else {
                    $formGroup.removeClass('error');
                    $formGroup.find('.error-message').remove();
                }
            });

            // Email validation
            $(document).on('blur', 'input[type="email"]', function() {
                const $input = $(this);
                const $formGroup = $input.closest('.form-group');
                const email = $input.val();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                
                if (email && !emailRegex.test(email)) {
                    $formGroup.addClass('error');
                    $formGroup.find('.error-message').remove();
                    $formGroup.append(`
                        <span class="error-message text-sm text-red-500 mt-1 block">
                            Please enter a valid email address.
                        </span>
                    `);
                }
            });
        }

        /**
         * Serialize form data to JSON
         */
        serializeForm($form) {
            const formArray = $form.serializeArray();
            const formData = {};
            
            formArray.forEach(field => {
                if (formData[field.name]) {
                    if (!Array.isArray(formData[field.name])) {
                        formData[field.name] = [formData[field.name]];
                    }
                    formData[field.name].push(field.value);
                } else {
                    formData[field.name] = field.value;
                }
            });
            
            return formData;
        }

        /**
         * Display form errors
         */
        displayFormErrors($form, errors) {
            // Clear existing errors
            $form.find('.error-message').remove();
            $form.find('.form-group').removeClass('error');
            
            if (!errors) return;
            
            Object.keys(errors).forEach(fieldName => {
                const $field = $form.find(`[name="${fieldName}"]`);
                const $formGroup = $field.closest('.form-group');
                const errorMessages = Array.isArray(errors[fieldName]) 
                    ? errors[fieldName] 
                    : [errors[fieldName]];
                
                $formGroup.addClass('error');
                errorMessages.forEach(message => {
                    $formGroup.append(`
                        <span class="error-message text-sm text-red-500 mt-1 block">
                            ${message}
                        </span>
                    `);
                });
            });
        }
    }

    /**
     * Theme Manager - Handles dark mode toggle
     */
    class ThemeManager {
        constructor() {
            this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        }

        /**
         * Initialize theme
         */
        init() {
            this.applyTheme(this.currentTheme);
            this.setupToggle();
        }

        /**
         * Get stored theme from localStorage
         */
        getStoredTheme() {
            return localStorage.getItem('theme');
        }

        /**
         * Get system theme preference
         */
        getSystemTheme() {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        /**
         * Apply theme
         */
        applyTheme(theme) {
            if (theme === 'dark') {
                $('html').addClass('dark');
            } else {
                $('html').removeClass('dark');
            }
            
            this.currentTheme = theme;
            localStorage.setItem('theme', theme);
        }

        /**
         * Toggle theme
         */
        toggle() {
            const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.applyTheme(newTheme);
        }

        /**
         * Setup theme toggle button
         */
        setupToggle() {
            $(document).on('click', '[data-theme-toggle]', () => {
                this.toggle();
            });
        }
    }

    /**
     * SweetAlert2 Manager - Beautiful alert modals
     */
    class SweetAlert2Manager {
        constructor() {
            this.defaultConfig = {
                confirmButtonColor: 'hsl(199, 89%, 48%)',  // Primary color
                cancelButtonColor: 'hsl(215, 16%, 47%)',   // Muted color
                customClass: {
                    popup: 'rounded-xl shadow-xl',
                    title: 'text-2xl font-bold',
                    htmlContainer: 'text-base',
                    confirmButton: 'btn btn-primary',
                    cancelButton: 'btn btn-outline'
                }
            };
        }

        /**
         * Success alert
         */
        success(title, message = '', options = {}) {
            return Swal.fire({
                icon: 'success',
                title: title,
                text: message,
                ...this.defaultConfig,
                ...options
            });
        }

        /**
         * Error alert
         */
        error(title, message = '', options = {}) {
            return Swal.fire({
                icon: 'error',
                title: title,
                text: message,
                ...this.defaultConfig,
                ...options
            });
        }

        /**
         * Warning alert
         */
        warning(title, message = '', options = {}) {
            return Swal.fire({
                icon: 'warning',
                title: title,
                text: message,
                ...this.defaultConfig,
                ...options
            });
        }

        /**
         * Info alert
         */
        info(title, message = '', options = {}) {
            return Swal.fire({
                icon: 'info',
                title: title,
                text: message,
                ...this.defaultConfig,
                ...options
            });
        }

        /**
         * Confirmation dialog
         */
        async confirm(title, message = '', options = {}) {
            const result = await Swal.fire({
                icon: 'question',
                title: title,
                text: message,
                showCancelButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: 'No',
                ...this.defaultConfig,
                ...options
            });

            return result.isConfirmed;
        }

        /**
         * Delete confirmation
         */
        async confirmDelete(itemName = 'this item') {
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Are you sure?',
                text: `Do you want to delete ${itemName}? This action cannot be undone.`,
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#ef4444',
                ...this.defaultConfig
            });

            return result.isConfirmed;
        }

        /**
         * Toast notification (small popup)
         */
        toast(message, icon = 'success', options = {}) {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            });

            return Toast.fire({
                icon: icon,
                title: message,
                ...options
            });
        }

        /**
         * Loading modal
         */
        loading(title = 'Loading...', message = 'Please wait') {
            return Swal.fire({
                title: title,
                text: message,
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                },
                ...this.defaultConfig
            });
        }

        /**
         * Close the current alert
         */
        close() {
            Swal.close();
        }

        /**
         * Input dialog
         */
        async input(title, options = {}) {
            const result = await Swal.fire({
                title: title,
                input: 'text',
                showCancelButton: true,
                confirmButtonText: 'Submit',
                cancelButtonText: 'Cancel',
                ...this.defaultConfig,
                ...options
            });

            if (result.isConfirmed) {
                return result.value;
            }
            return null;
        }

        /**
         * Custom HTML content
         */
        custom(options = {}) {
            return Swal.fire({
                ...this.defaultConfig,
                ...options
            });
        }
    }

    /**
     * Initialize the application when DOM is ready
     */
    $(document).ready(() => {
        window.app = new FirstHealthApp();
    });

})(jQuery);

