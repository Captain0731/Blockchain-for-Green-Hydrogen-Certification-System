// Theme Management
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        // Set initial theme
        this.setTheme(this.currentTheme);
        
        // Add event listener to theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Update theme icon
        this.updateThemeIcon();
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        this.updateThemeIcon();
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: theme } 
        }));
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    updateThemeIcon() {
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            if (this.currentTheme === 'light') {
                themeIcon.className = 'fas fa-moon';
            } else {
                themeIcon.className = 'fas fa-sun';
            }
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.themeManager = new ThemeManager();
    
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add animation classes to cards when they come into view
    const observeElements = document.querySelectorAll('.stats-card, .content-card, .feature-card, .certificate-card');
    
    if (observeElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationDelay = Math.random() * 0.5 + 's';
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1
        });
        
        observeElements.forEach(el => {
            observer.observe(el);
        });
    }
});

// Add CSS animation styles
const animationStyles = `
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animate-in {
        animation: slideInUp 0.6s ease-out forwards;
    }
    
    .stats-card, .content-card, .feature-card, .certificate-card {
        opacity: 0;
    }
    
    .stats-card.animate-in, 
    .content-card.animate-in, 
    .feature-card.animate-in, 
    .certificate-card.animate-in {
        opacity: 1;
    }
`;

// Inject animation styles
const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);

// Utility functions for other scripts
window.utils = {
    // Format numbers with commas
    formatNumber: function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    // Format date
    formatDate: function(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    },
    
    // Show notification
    showNotification: function(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const flashContainer = document.querySelector('.flash-messages') || 
                              document.body.appendChild(document.createElement('div'));
        flashContainer.className = 'flash-messages';
        flashContainer.appendChild(alertDiv);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    },
    
    // Get theme colors for 3D visualizations
    getThemeColors: function() {
        const theme = window.themeManager?.getCurrentTheme() || 'light';
        return {
            primary: theme === 'light' ? 0x1E90FF : 0x1E90FF,
            success: theme === 'light' ? 0x32CD32 : 0x32CD32,
            background: theme === 'light' ? 0xffffff : 0x0f1724,
            text: theme === 'light' ? 0x0b1220 : 0xe6eef6
        };
    }
};
