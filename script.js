/**
 * ============================================================================
 * FILE: script.js
 * PROJECT: ABHISHEK KUMAR - AI RESEARCH PORTFOLIO
 * SYSTEM: NEURAL INTERFACE v2.4 (STABLE)
 * AUTHOR: Abhishek Kumar
 * DESCRIPTION: 
 * Core logic controller for the portfolio dashboard. Handles WebGL-style 
 * canvas rendering, DOM manipulation, GSAP animations, and simulated 
 * AI system processes.
 * ============================================================================
 */

/* ============================================================================
   1. SYSTEM CONFIGURATION & GLOBAL STATE
   ============================================================================ */

const SYSTEM_CONFIG = {
    core: {
        version: '2.4.0',
        build: '2025-RC1',
        debugMode: true, // Set to false in production
        frameRate: 60,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    },
    theme: {
        colors: {
            cyan: '#00f0ff',
            purple: '#7000ff',
            dark: '#03080f',
            white: '#ffffff',
            success: '#00ff9d',
            error: '#ff0055'
        },
        fonts: {
            code: '"Fira Code", monospace',
            display: '"Orbitron", sans-serif'
        }
    },
    animation: {
        textScrambleSpeed: 50, // ms
        typingSpeed: 30, // ms
        particleCount: window.innerWidth > 1000 ? 120 : 60,
        connectionRadius: 150
    },
    selectors: {
        loader: '#system-loader',
        loaderLog: '#loader-log',
        canvas: '#neural-bg-canvas',
        sidebar: '.ai-sidebar',
        main: '.ai-main-interface',
        menuToggle: '.menu-toggle',
        timeDisplay: '#current-time'
    }
};

/**
 * Global State Store
 * Tracks the current status of the interface and user interactions.
 */
const STATE = {
    isBooted: false,
    isMenuOpen: false,
    mouseX: 0,
    mouseY: 0,
    scrollPos: 0,
    activeSection: 'home',
    terminalHistory: []
};

/* ============================================================================
   2. UTILITY MODULE (HELPER FUNCTIONS)
   ============================================================================ */

const Utils = {
    /**
     * Generates a random integer between min and max.
     */
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1) + min),

    /**
     * Generates a random float between min and max.
     */
    randomFloat: (min, max) => Math.random() * (max - min) + min,

    /**
     * Maps a number from one range to another.
     */
    mapRange: (value, inMin, inMax, outMin, outMax) => {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },

    /**
     * Debounces a function to limit execution rate.
     */
    debounce: (func, wait) => {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },

    /**
     * Throttle function for scroll events.
     */
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * System Logger - formatted console output.
     */
    log: (msg, type = 'INFO') => {
        if (!SYSTEM_CONFIG.core.debugMode) return;
        const timestamp = new Date().toLocaleTimeString();
        const styles = {
            INFO: 'color: #00f0ff; background: #03080f; padding: 2px 5px;',
            WARN: 'color: #ffbd2e; background: #03080f; padding: 2px 5px;',
            ERROR: 'color: #ff0055; background: #03080f; font-weight: bold; padding: 2px 5px;',
            SYS: 'color: #00ff9d; background: #03080f; font-weight: bold; padding: 2px 5px;'
        };
        console.log(`%c[${type}] ${timestamp} >> ${msg}`, styles[type] || styles.INFO);
    }
};

/* ============================================================================
   3. BOOT SEQUENCE (PRELOADER)
   ============================================================================ */

class BootSequence {
    constructor() {
        this.loader = document.querySelector(SYSTEM_CONFIG.selectors.loader);
        this.logElement = document.querySelector(SYSTEM_CONFIG.selectors.loaderLog);
        this.steps = [
            "Initializing Kernel...",
            "Loading Neural Weights...",
            "Mounting File System...",
            "Connecting to Global Grid...",
            "Calibrating Holograms...",
            "System Ready."
        ];
    }

    async init() {
        Utils.log("Boot sequence initiated.", "SYS");
        
        // Disable scroll
        document.body.style.overflow = 'hidden';

        for (let i = 0; i < this.steps.length; i++) {
            await this.processStep(this.steps[i], i === this.steps.length - 1);
        }

        this.complete();
    }

    processStep(text, isLast) {
        return new Promise(resolve => {
            const delay = Utils.randomInt(300, 800);
            
            // Update UI
            if (this.logElement) {
                this.logElement.innerText = `> ${text}`;
                this.logElement.classList.add('glitch-text');
                setTimeout(() => this.logElement.classList.remove('glitch-text'), 200);
            }

            setTimeout(resolve, delay);
        });
    }

    complete() {
        Utils.log("Boot sequence complete.", "SYS");
        STATE.isBooted = true;

        // Fade out animation
        if (this.loader) {
            this.loader.style.transition = 'opacity 0.8s ease-in-out';
            this.loader.style.opacity = '0';
            
            setTimeout(() => {
                this.loader.style.display = 'none';
                document.body.style.overflow = 'visible';
                
                // Trigger Hero Animations
                AnimationController.triggerHero();
            }, 800);
        }
    }
}

/* ============================================================================
   4. NEURAL CANVAS ENGINE (BACKGROUND VISUALIZATION)
   ============================================================================ */

class NeuralCanvas {
    constructor() {
        this.canvas = document.querySelector(SYSTEM_CONFIG.selectors.canvas);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.connections = [];
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Mouse interaction radius
        this.mouseRadius = 150;
        
        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.animate();

        // Event Listeners
        window.addEventListener('resize', Utils.debounce(() => this.resize(), 200));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        Utils.log("Neural Canvas Engine initialized.", "INFO");
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Adjust particle count based on screen size
        SYSTEM_CONFIG.animation.particleCount = this.width > 1000 ? 120 : 60;
        this.createParticles(); // Recreate on resize
    }

    handleMouseMove(e) {
        STATE.mouseX = e.x;
        STATE.mouseY = e.y;
    }

    createParticles() {
        this.particles = [];
        const count = SYSTEM_CONFIG.animation.particleCount;

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 1.5, // Velocity X
                vy: (Math.random() - 0.5) * 1.5, // Velocity Y
                size: Math.random() * 2 + 1,
                color: SYSTEM_CONFIG.theme.colors.cyan
            });
        }
    }

    draw() {
        // Clear Canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Update & Draw Particles
        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];
            
            // Move
            p.x += p.vx;
            p.y += p.vy;

            // Boundary Check (Bounce)
            if (p.x < 0 || p.x > this.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.height) p.vy *= -1;

            // Mouse Interaction (Repel/Attract)
            const dx = STATE.mouseX - p.x;
            const dy = STATE.mouseY - p.y;
            const distance = Math.sqrt(dx*dx + dy*dy);

            if (distance < this.mouseRadius) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (this.mouseRadius - distance) / this.mouseRadius;
                const directionX = forceDirectionX * force * 2; // Repel strength
                const directionY = forceDirectionY * force * 2;

                p.x -= directionX;
                p.y -= directionY;
            }

            // Draw Particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
        }
        
        // Draw Connections
        this.connectParticles();
    }

    connectParticles() {
        const maxDist = SYSTEM_CONFIG.animation.connectionRadius;
        
        for (let a = 0; a < this.particles.length; a++) {
            for (let b = a; b < this.particles.length; b++) {
                let dx = this.particles[a].x - this.particles[b].x;
                let dy = this.particles[a].y - this.particles[b].y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxDist) {
                    let opacity = 1 - (dist / maxDist);
                    this.ctx.strokeStyle = `rgba(0, 240, 255, ${opacity * 0.2})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[a].x, this.particles[a].y);
                    this.ctx.lineTo(this.particles[b].x, this.particles[b].y);
                    this.ctx.stroke();
                }
            }
        }
    }

    animate() {
        if (!SYSTEM_CONFIG.core.reducedMotion) {
            this.draw();
        }
        requestAnimationFrame(() => this.animate());
    }
}

/* ============================================================================
   5. UI CONTROLLER (HUD, SIDEBAR, INTERACTIONS)
   ============================================================================ */

class InterfaceController {
    constructor() {
        this.sidebar = document.querySelector(SYSTEM_CONFIG.selectors.sidebar);
        this.menuToggle = document.querySelector(SYSTEM_CONFIG.selectors.menuToggle);
        this.timeDisplay = document.querySelector(SYSTEM_CONFIG.selectors.timeDisplay);
        
        this.init();
    }

    init() {
        this.setupTimeUpdate();
        this.setupMobileMenu();
        this.setupSmoothScroll();
        this.setupActiveLinkHighlight();
        
        Utils.log("Interface Controller initialized.", "INFO");
    }

    setupTimeUpdate() {
        if (!this.timeDisplay) return;

        const update = () => {
            const now = new Date();
            // Format: HH:MM:SS
            const timeString = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            this.timeDisplay.innerText = timeString;
        };

        setInterval(update, 1000);
        update(); // Initial call
    }

    setupMobileMenu() {
        if (!this.menuToggle || !this.sidebar) return;

        this.menuToggle.addEventListener('click', () => {
            STATE.isMenuOpen = !STATE.isMenuOpen;
            this.sidebar.classList.toggle('active');
            
            // Animate Icon
            const icon = this.menuToggle.querySelector('i');
            if (STATE.isMenuOpen) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking a link
        const links = this.sidebar.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    STATE.isMenuOpen = false;
                    this.sidebar.classList.remove('active');
                    const icon = this.menuToggle.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElem = document.querySelector(targetId);
                if (targetElem) {
                    const headerOffset = 70; // HUD height
                    const elementPosition = targetElem.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }
            });
        });
    }

    setupActiveLinkHighlight() {
        const sections = document.querySelectorAll('.screen-section');
        const navLi = document.querySelectorAll('.sidebar-menu li');

        window.addEventListener('scroll', Utils.throttle(() => {
            let current = '';
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                    current = section.getAttribute('id');
                }
            });

            navLi.forEach(li => {
                li.classList.remove('active');
                if (li.querySelector('a').getAttribute('href') === `#${current}`) {
                    li.classList.add('active');
                }
            });
        }, 100));
    }
}

/* ============================================================================
   6. TEXT SCRAMBLE ENGINE (CYBERPUNK EFFECT)
   ============================================================================ */

class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }

    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }
        
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }

    update() {
        let output = '';
        let complete = 0;
        
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span class="dud">${char}</span>`;
            } else {
                output += from;
            }
        }
        
        this.el.innerHTML = output;
        
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }

    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

/* ============================================================================
   7. HOLOGRAM EFFECT (3D TILT LOGIC)
   ============================================================================ */

class HologramController {
    constructor() {
        this.heroSection = document.querySelector('.hero-screen');
        this.hologramContainer = document.querySelector('.hologram-container');
        this.neuralGraph = document.querySelector('.neural-graph');
        this.floatingCards = document.querySelectorAll('.floating-card');
        
        this.init();
    }

    init() {
        if (!this.heroSection || !this.hologramContainer) return;
        
        this.heroSection.addEventListener('mousemove', (e) => this.handleTilt(e));
        this.heroSection.addEventListener('mouseleave', () => this.resetTilt());
        
        Utils.log("Hologram Systems Online.", "INFO");
    }

    handleTilt(e) {
        if (SYSTEM_CONFIG.core.reducedMotion) return;

        const rect = this.heroSection.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate percentages (-1 to 1)
        const xPct = (x / rect.width - 0.5) * 2;
        const yPct = (y / rect.height - 0.5) * 2;
        
        // Apply Transform to Container
        const tiltX = yPct * 10; // degrees
        const tiltY = -xPct * 10; // degrees
        
        this.hologramContainer.style.transform = `
            perspective(1000px) 
            rotateX(${tiltX}deg) 
            rotateY(${tiltY}deg) 
            scale(1.05)
        `;
        
        // Parallax for inner elements
        if (this.neuralGraph) {
            this.neuralGraph.style.transform = `translateZ(50px) translateX(${xPct * -10}px)`;
        }
        
        this.floatingCards.forEach((card, index) => {
            const depth = (index + 1) * 20;
            card.style.transform = `
                translateZ(${depth}px) 
                translateX(${xPct * -15 * (index+1)}px) 
                translateY(${yPct * -15 * (index+1)}px)
            `;
        });
    }

    resetTilt() {
        this.hologramContainer.style.transform = `
            perspective(1000px) 
            rotateX(0deg) 
            rotateY(0deg) 
            scale(1)
        `;
        
        if (this.neuralGraph) {
            this.neuralGraph.style.transform = `translateZ(0) translateX(0)`;
        }
        
        this.floatingCards.forEach(card => {
            // Revert to CSS animation
            card.style.transform = ''; 
        });
    }
}

/* ============================================================================
   8. TERMINAL SYSTEM (CONTACT FORM)
   ============================================================================ */

class TerminalSystem {
    constructor() {
        this.terminal = document.querySelector('.contact-terminal');
        this.inputs = document.querySelectorAll('.tech-input');
        this.sendBtn = document.querySelector('.btn-send-cmd');
        
        this.init();
    }

    init() {
        if (!this.terminal) return;

        // Sound effects (simulated)
        this.inputs.forEach(input => {
            input.addEventListener('focus', () => {
                this.logStatus(`Input stream active: ${input.getAttribute('placeholder')}`);
            });
            
            input.addEventListener('input', () => {
                // Play fake typing sound logic here if audio was enabled
            });
        });

        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.executeSend();
            });
        }
    }

    logStatus(msg) {
        // Find or create a status line in the terminal
        let statusLine = this.terminal.querySelector('.status-line');
        if (!statusLine) {
            statusLine = document.createElement('div');
            statusLine.className = 'status-line';
            statusLine.style.color = '#555';
            statusLine.style.fontFamily = 'monospace';
            statusLine.style.marginTop = '10px';
            statusLine.style.fontSize = '0.7rem';
            this.terminal.querySelector('.terminal-body').appendChild(statusLine);
        }
        
        const time = new Date().toLocaleTimeString();
        statusLine.innerText = `[${time}] SYSTEM: ${msg}`;
    }

    async executeSend() {
        const name = this.inputs[0].value;
        const email = this.inputs[1].value;
        const message = this.inputs[2].value;

        if (!name || !email || !message) {
            this.logStatus("ERROR: NULL_DATA_EXCEPTION. All fields required.");
            // Shake animation
            this.terminal.classList.add('shake');
            setTimeout(() => this.terminal.classList.remove('shake'), 500);
            return;
        }

        // Simulate sending
        this.logStatus("Encrypting payload...");
        this.sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> TRANSMITTING...';
        this.sendBtn.disabled = true;

        await new Promise(r => setTimeout(r, 1500));
        
        this.logStatus("Handshake established with server...");
        await new Promise(r => setTimeout(r, 1000));
        
        this.logStatus("Payload delivered successfully.");
        this.sendBtn.innerHTML = '<i class="fas fa-check"></i> SENT';
        this.sendBtn.style.background = SYSTEM_CONFIG.theme.colors.success;

        // Reset form after delay
        setTimeout(() => {
            this.inputs.forEach(i => i.value = '');
            this.sendBtn.innerHTML = '<i class="fas fa-terminal"></i> EXECUTE_SEND';
            this.sendBtn.style.background = '';
            this.sendBtn.disabled = false;
            this.logStatus("Ready for new transmission.");
        }, 3000);
    }
}

/* ============================================================================
   9. ANIMATION CONTROLLER (GSAP / AOS WRAPPER)
   ============================================================================ */

class AnimationController {
    static init() {
        // Initialize AOS if available
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                offset: 100,
                once: true,
                easing: 'ease-out-cubic'
            });
            Utils.log("AOS Module Loaded.", "INFO");
        }

        // Initialize Skill Bars Animation
        this.initSkillBars();
        
        // Initialize Typewriter Effects
        this.initTypewriter();
    }

    static triggerHero() {
        if (typeof gsap === 'undefined') return;

        const tl = gsap.timeline();

        // Animate Hero Elements
        tl.from('.glitch-heading', {
            duration: 1,
            y: 50,
            opacity: 0,
            ease: 'power3.out',
            onComplete: () => {
                // Trigger Text Scramble
                const el = document.querySelector('.glitch-heading');
                if (el) {
                    const scrambler = new TextScramble(el);
                    scrambler.setText('ABHISHEK KUMAR');
                }
            }
        })
        .from('.sub-heading', { duration: 0.8, y: 30, opacity: 0, ease: 'power2.out' }, "-=0.5")
        .from('.cmd-prompt-style', { duration: 0.5, scaleX: 0, transformOrigin: "left", ease: 'expo.inOut' }, "-=0.8")
        .from('.hero-description', { duration: 0.8, opacity: 0 }, "-=0.3")
        .from('.action-buttons a', { duration: 0.5, y: 20, opacity: 0, stagger: 0.2 }, "-=0.5")
        .from('.hologram-container', { duration: 1.5, scale: 0, opacity: 0, rotationY: 90, ease: 'back.out(1.7)' }, "-=1.0");
    }

    static initSkillBars() {
        const skillsSection = document.querySelector('#skills');
        const bars = document.querySelectorAll('.lvl-bar .fill');
        
        if (!skillsSection) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    bars.forEach(bar => {
                        const width = bar.style.width;
                        bar.style.width = '0';
                        setTimeout(() => {
                            bar.style.transition = 'width 1.5s ease-in-out';
                            bar.style.width = width;
                        }, 200);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        observer.observe(skillsSection);
    }

    static initTypewriter() {
        const cmdText = document.querySelector('.prompt-cmd');
        if (cmdText) {
            // Reset text
            const text = "./init_introduction.py";
            cmdText.innerText = '';
            
            // Wait for boot
            setTimeout(() => {
                let i = 0;
                const interval = setInterval(() => {
                    cmdText.innerText += text.charAt(i);
                    i++;
                    if (i >= text.length) clearInterval(interval);
                }, 50);
            }, 3500);
        }
    }
}

/* ============================================================================
   10. EASTER EGGS (SYSTEM SECRETS)
   ============================================================================ */

class SystemSecrets {
    constructor() {
        this.keyBuffer = [];
        this.konamiCode = [
            'ArrowUp', 'ArrowUp', 
            'ArrowDown', 'ArrowDown', 
            'ArrowLeft', 'ArrowRight', 
            'ArrowLeft', 'ArrowRight', 
            'b', 'a'
        ];
        
        document.addEventListener('keydown', (e) => this.checkInput(e));
    }

    checkInput(e) {
        this.keyBuffer.push(e.key);
        if (this.keyBuffer.length > this.konamiCode.length) {
            this.keyBuffer.shift();
        }

        if (this.keyBuffer.join('') === this.konamiCode.join('')) {
            this.activateGodMode();
        }
    }

    activateGodMode() {
        Utils.log("GOD MODE ACTIVATED", "SYS");
        alert("ACCESS GRANTED: SYSTEM OVERRIDE INITIATED.");
        
        document.documentElement.style.setProperty('--accent-primary', '#ff00ff');
        document.documentElement.style.setProperty('--bg-deep', '#000000');
        
        const matrixCanvas = new NeuralCanvas();
        matrixCanvas.particles.forEach(p => p.color = '#ff00ff');
    }
}

/* ============================================================================
   11. MAIN INITIALIZATION
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Start Boot Sequence
    const boot = new BootSequence();
    boot.init();

    // 2. Initialize Sub-Systems
    const neuralNet = new NeuralCanvas();
    const ui = new InterfaceController();
    const hologram = new HologramController();
    const terminal = new TerminalSystem();
    const secrets = new SystemSecrets();

    // 3. Initialize Animations (Delayed slightly for DOM stability)
    setTimeout(() => {
        AnimationController.init();
    }, 100);

    // 4. Developer Signature
    console.log(
        `%c ABHISHEK KUMAR %c AI PORTFOLIO v${SYSTEM_CONFIG.core.version} `,
        'background:#00f0ff; color:#000; font-weight:bold; padding: 5px; border-radius: 4px 0 0 4px;',
        'background:#03080f; color:#00f0ff; padding: 5px; border-radius: 0 4px 4px 0;'
    );
});

/* ============================================================================
   END OF FILE
   ============================================================================ */
