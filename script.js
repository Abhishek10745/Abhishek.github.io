const CONFIG = {
    core: {
        id: 'AK-SYS-V4.2',
        fps: 60,
        debug: false,
        isMobile: window.innerWidth < 768,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    },
    theme: {
        colors: {
            background: '#03080f',
            cyan: '#00f0ff',
            purple: '#7000ff',
            pink: '#ff0055',
            green: '#00ff9d',
            white: '#ffffff',
            glass: 'rgba(255, 255, 255, 0.05)',
            grid: 'rgba(0, 240, 255, 0.1)'
        },
        fonts: {
            primary: 'Rajdhani, sans-serif',
            code: 'Fira Code, monospace'
        }
    },
    ann: {
        nodeCountDesktop: 60,
        nodeCountMobile: 25,
        connectionDistance: 180,
        mouseRadius: 250,
        mouseForce: 2,
        floatSpeed: 0.5,
        floatRange: 20,
        pulseChance: 0.02,
        signalSpeed: 0.15,
        nodeRadiusMin: 4,
        nodeRadiusMax: 12
    },
    bg: {
        particleCountDesktop: 100,
        particleCountMobile: 40,
        connectionDistance: 140,
        baseSpeed: 0.3
    },
    ui: {
        typingSpeed: 50,
        scrollThreshold: 100
    }
};

const STATE = {
    screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: Math.min(window.devicePixelRatio, 2),
        centerX: window.innerWidth / 2,
        centerY: window.innerHeight / 2
    },
    mouse: {
        x: -9999,
        y: -9999,
        isActive: false,
        isClicking: false
    },
    scroll: {
        current: 0,
        target: 0,
        last: 0,
        direction: 'down'
    },
    time: {
        now: 0,
        last: 0,
        delta: 0,
        elapsed: 0
    }
};

class Vector2 {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mult(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }

    div(s) {
        if (s === 0) return this;
        this.x /= s;
        this.y /= s;
        return this;
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const m = this.mag();
        if (m !== 0) {
            this.div(m);
        }
        return this;
    }

    limit(max) {
        if (this.mag() > max) {
            this.normalize();
            this.mult(max);
        }
        return this;
    }

    dist(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    copy() {
        return new Vector2(this.x, this.y);
    }

    static sub(v1, v2) {
        return new Vector2(v1.x - v2.x, v1.y - v2.y);
    }
}

class Utils {
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    static map(value, start1, stop1, start2, stop2) {
        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
    }

    static lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    static dist(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static rgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    static throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static debounce(func, delay) {
        let debounceTimer;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        };
    }
}

class EventManager {
    constructor() {
        this.listeners = {};
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, payload) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(payload));
        }
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }
}

const Events = new EventManager();

class InputHandler {
    constructor() {
        this.init();
    }

    init() {
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        window.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        window.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        window.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        window.addEventListener('resize', Utils.debounce(this.handleResize.bind(this), 200));
    }

    handleMouseMove(e) {
        STATE.mouse.x = e.clientX;
        STATE.mouse.y = e.clientY;
        STATE.mouse.isActive = true;
    }

    handleMouseDown() {
        STATE.mouse.isClicking = true;
        Events.emit('click', { x: STATE.mouse.x, y: STATE.mouse.y });
    }

    handleMouseUp() {
        STATE.mouse.isClicking = false;
    }

    handleTouchStart(e) {
        if(e.touches.length > 0) {
            STATE.mouse.x = e.touches[0].clientX;
            STATE.mouse.y = e.touches[0].clientY;
            STATE.mouse.isActive = true;
            STATE.mouse.isClicking = true;
        }
    }

    handleTouchMove(e) {
        if(e.touches.length > 0) {
            STATE.mouse.x = e.touches[0].clientX;
            STATE.mouse.y = e.touches[0].clientY;
        }
    }

    handleTouchEnd() {
        STATE.mouse.isActive = false;
        STATE.mouse.isClicking = false;
        STATE.mouse.x = -9999;
        STATE.mouse.y = -9999;
    }

    handleResize() {
        STATE.screen.width = window.innerWidth;
        STATE.screen.height = window.innerHeight;
        STATE.screen.centerX = window.innerWidth / 2;
        STATE.screen.centerY = window.innerHeight / 2;
        CONFIG.core.isMobile = window.innerWidth < 768;
        Events.emit('resize', STATE.screen);
    }
}

class CanvasController {
    constructor(id) {
        this.id = id;
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.width = 0;
        this.height = 0;
        this.isValid = !!this.canvas;
        
        if (this.isValid) {
            this.resize();
            Events.on('resize', this.resize.bind(this));
        }
    }

    resize() {
        if (!this.isValid) return;
        
        const parent = this.canvas.parentElement;
        if (parent) {
            this.width = parent.clientWidth;
            this.height = parent.clientHeight;
            
            this.canvas.width = this.width * STATE.screen.dpr;
            this.canvas.height = this.height * STATE.screen.dpr;
            
            this.ctx.scale(STATE.screen.dpr, STATE.screen.dpr);
            
            this.canvas.style.width = `${this.width}px`;
            this.canvas.style.height = `${this.height}px`;
        }
    }

    clear() {
        if (!this.isValid) return;
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
}

class NeuralSignal {
    constructor(startNode, endNode) {
        this.start = startNode;
        this.end = endNode;
        this.progress = 0;
        // CHANGE: Reduced speed
        this.speed = Utils.random(0.005, 0.015);
        this.active = true;
        this.color = Math.random() > 0.5 ? CONFIG.theme.colors.cyan : CONFIG.theme.colors.pink;
        this.size = Utils.random(2, 4);
    }

    update() {
        this.progress += this.speed;
        if (this.progress >= 1) {
            this.active = false;
            this.end.activate(0.3);
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        const x = Utils.lerp(this.start.pos.x, this.end.pos.x, this.progress);
        const y = Utils.lerp(this.start.pos.y, this.end.pos.y, this.progress);
        
        ctx.beginPath();
        ctx.arc(x, y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class NeuralNode {
    constructor(x, y, id) {
        this.id = id;
        this.basePos = new Vector2(x, y);
        this.pos = new Vector2(x, y);
        this.vel = new Vector2(0, 0);
        this.acc = new Vector2(0, 0);
        
        this.radius = Utils.random(CONFIG.ann.nodeRadiusMin, CONFIG.ann.nodeRadiusMax);
        this.baseRadius = this.radius;
        
        this.floatOffset = Utils.random(0, Math.PI * 2);
        this.activation = 0;
        this.connections = [];
        
        this.isAnchor = false;
        this.layer = 0;
    }

    connect(node) {
        this.connections.push(node);
    }

    activate(amount) {
        this.activation = Math.min(this.activation + amount, 1);
    }

    update(mousePos) {
        // CHANGE: Removed wobble floating math
        // this.floatOffset += 0.02;
        // const floatX = Math.cos(this.floatOffset) * CONFIG.ann.floatRange * 0.5;
        // const floatY = Math.sin(this.floatOffset) * CONFIG.ann.floatRange * 0.5;
        
        // Target is just the base position now
        const targetX = this.basePos.x;
        const targetY = this.basePos.y;
        
        const force = new Vector2(targetX - this.pos.x, targetY - this.pos.y);
        force.mult(CONFIG.ann.floatSpeed * 0.1);
        this.acc.add(force);

        if (STATE.mouse.isActive) {
            const mouseV = new Vector2(mousePos.x, mousePos.y);
            const dist = this.pos.dist(mouseV);
            
            if (dist < CONFIG.ann.mouseRadius) {
                const repulsion = Vector2.sub(this.pos, mouseV);
                repulsion.normalize();
                const magnitude = (CONFIG.ann.mouseRadius - dist) / CONFIG.ann.mouseRadius;
                repulsion.mult(magnitude * CONFIG.ann.mouseForce * 5);
                this.acc.add(repulsion);
                
                this.activate(0.01);
            }
        }

        this.vel.add(this.acc);
        this.vel.mult(0.92); 
        this.pos.add(this.vel);
        this.acc.mult(0);

        this.activation = Math.max(this.activation - 0.01, 0);
        this.radius = this.baseRadius + (this.activation * 5);
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        
        let r, g, b;
        
        if (this.activation > 0.5) {
            const t = (this.activation - 0.5) * 2;
            r = Utils.lerp(0, 255, t); 
            g = Utils.lerp(240, 0, t); 
            b = Utils.lerp(255, 85, t); 
        } else {
            const t = this.activation * 2;
            r = 0;
            g = Utils.lerp(240, 240, t);
            b = 255;
        }

        const color = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${0.5 + this.activation * 0.5})`;
        const glowColor = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, 0.8)`;
        
        ctx.fillStyle = color;
        ctx.fill();
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + this.activation * 0.7})`;
        ctx.stroke();

        if (this.activation > 0.1) {
            ctx.shadowBlur = 20 * this.activation;
            ctx.shadowColor = glowColor;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        if (this.activation > 0.8) {
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius * 1.5, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${this.activation * 0.2})`;
            ctx.stroke();
        }
    }
}

class NeuralNetworkSystem {
    constructor() {
        this.canvas = new CanvasController('hero-network-canvas');
        this.nodes = [];
        this.signals = [];
        this.initialized = false;
        
        if (this.canvas.isValid) {
            this.init();
        }
    }

    init() {
        this.createNodes();
        Events.on('resize', () => {
            setTimeout(() => this.createNodes(), 100);
        });
        this.initialized = true;
    }

    createNodes() {
        this.nodes = [];
        this.signals = [];
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        const layerCount = CONFIG.core.isMobile ? 4 : 6;
        const nodesPerLayerBase = CONFIG.core.isMobile ? 4 : 7;
        
        const layerSpacing = width / (layerCount + 1);
        
        for (let l = 0; l < layerCount; l++) {
            const x = (l + 1) * layerSpacing;
            const variance = CONFIG.core.isMobile ? 1 : 2;
            const count = nodesPerLayerBase + Utils.randomInt(-variance, variance);
            const vSpacing = height / (count + 1);
            
            for (let i = 0; i < count; i++) {
                const y = (i + 1) * vSpacing + Utils.random(-30, 30);
                const node = new NeuralNode(x, y, this.nodes.length);
                node.layer = l;
                this.nodes.push(node);
            }
        }
        
        this.createConnections();
    }

    createConnections() {
        this.nodes.forEach(node => {
            const potentialNeighbors = this.nodes.filter(n => n.layer === node.layer + 1);
            
            potentialNeighbors.forEach(neighbor => {
                if (Math.random() > 0.005) {
                    node.connect(neighbor);
                }
            });

            if (node.layer < CONFIG.core.isMobile ? 3 : 5) {
                if (node.connections.length === 0 && potentialNeighbors.length > 0) {
                    const randomNeighbor = potentialNeighbors[Math.floor(Math.random() * potentialNeighbors.length)];
                    node.connect(randomNeighbor);
                }
            }
        });
    }

    spawnSignal() {
        if (this.nodes.length === 0) return;
        
        const startLayerNodes = this.nodes.filter(n => n.layer === 0);
        const randomStart = startLayerNodes[Math.floor(Math.random() * startLayerNodes.length)];
        
        if (randomStart && randomStart.connections.length > 0) {
            const endNode = randomStart.connections[Math.floor(Math.random() * randomStart.connections.length)];
            this.signals.push(new NeuralSignal(randomStart, endNode));
            randomStart.activate(0.5);
        }
    }

    propagateSignals() {
         if (Math.random() < 0.001) {
             const activeNodes = this.nodes.filter(n => n.activation > 0.5 && n.connections.length > 0);
             if (activeNodes.length > 0) {
                 const source = activeNodes[Math.floor(Math.random() * activeNodes.length)];
                 const dest = source.connections[Math.floor(Math.random() * source.connections.length)];
                 this.signals.push(new NeuralSignal(source, dest));
             }
         }
    }

    update() {
        if (!this.initialized) return;

        let localMouseX = -9999;
        let localMouseY = -9999;

        if (STATE.mouse.isActive) {
            const rect = this.canvas.canvas.getBoundingClientRect();
            if (STATE.mouse.x >= rect.left && STATE.mouse.x <= rect.right &&
                STATE.mouse.y >= rect.top && STATE.mouse.y <= rect.bottom) {
                localMouseX = STATE.mouse.x - rect.left;
                localMouseY = STATE.mouse.y - rect.top;
            }
        }

        const mouseVec = new Vector2(localMouseX, localMouseY);

        this.nodes.forEach(node => {
            node.update(mouseVec);
        });

        if (Math.random() < 0.000001) {
            this.spawnSignal();
        }

        this.propagateSignals();

        for (let i = this.signals.length - 1; i >= 0; i--) {
            this.signals[i].update();
            if (!this.signals[i].active) {
                this.signals.splice(i, 1);
            }
        }
    }

    draw() {
        if (!this.initialized) return;
        
        this.canvas.clear();
        const ctx = this.canvas.ctx;

        this.nodes.forEach(node => {
            node.connections.forEach(neighbor => {
                ctx.beginPath();
                ctx.moveTo(node.pos.x, node.pos.y);
                ctx.lineTo(neighbor.pos.x, neighbor.pos.y);
                
                const avgActivation = (node.activation + neighbor.activation) / 2;
                
                if (avgActivation > 0.1) {
                    // Active state (hovered or signal passing)
                    ctx.strokeStyle = avgActivation > 0.4 ? CONFIG.theme.colors.cyan : 'rgba(0, 240, 255, 0.8)';
                    ctx.lineWidth = 1.5 + (avgActivation * 2);
                    ctx.globalAlpha = 0.9 + (avgActivation * 0.1);
                } else {
                    // Resting state (not interacted with) -> NOW BRIGHTER
                    // Changed alpha from 0.2 to 0.6 for much higher visibility
                    ctx.strokeStyle = 'rgba(0, 240, 255, 1)'; 
                    ctx.lineWidth = 1;
                    // Changed globalAlpha to 1.0 (fully opaque line drawing)
                    ctx.globalAlpha = 1.0; 
                }
                
                ctx.stroke();
                ctx.globalAlpha = 1;
            });
        });

        this.signals.forEach(signal => signal.draw(ctx));
        this.nodes.forEach(node => node.draw(ctx));
    }
}

class BackgroundParticle {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.w;
        this.y = Math.random() * this.h;
        this.vx = (Math.random() - 0.5) * CONFIG.bg.baseSpeed;
        this.vy = (Math.random() - 0.5) * CONFIG.bg.baseSpeed;
        this.size = Math.random() * 2;
        this.life = Math.random() * 100;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life++;

        if (this.x < 0 || this.x > this.w || this.y < 0 || this.y > this.h) {
            this.reset();
        }
    }

    draw(ctx) {
        ctx.fillStyle = CONFIG.theme.colors.cyan;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class BackgroundSystem {
    constructor() {
        this.canvas = new CanvasController('neural-canvas');
        this.particles = [];
        this.initialized = false;

        if (this.canvas.isValid) {
            this.init();
        }
    }

    init() {
        this.createParticles();
        Events.on('resize', () => {
            this.createParticles();
        });
        this.initialized = true;
    }

    createParticles() {
        this.particles = [];
        const count = CONFIG.core.isMobile ? CONFIG.bg.particleCountMobile : CONFIG.bg.particleCountDesktop;
        
        for (let i = 0; i < count; i++) {
            this.particles.push(new BackgroundParticle(this.canvas.width, this.canvas.height));
        }
    }

    update() {
        if (!this.initialized) return;
        this.particles.forEach(p => p.update());
    }

    draw() {
        if (!this.initialized) return;
        this.canvas.clear();
        const ctx = this.canvas.ctx;
        
        const maxDist = CONFIG.bg.connectionDistance;

        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];
            p1.draw(ctx);

            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < maxDist) {
                    ctx.beginPath();
                    ctx.strokeStyle = CONFIG.theme.colors.cyan;
                    ctx.lineWidth = 0.5;
                    ctx.globalAlpha = 0.15 * (1 - dist / maxDist);
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1;
    }
}

class TypingEngine {
    constructor(elementId, phrases, options = {}) {
        this.element = document.getElementById(elementId);
        this.phrases = phrases;
        this.loop = options.loop !== false;
        this.typeSpeed = options.typeSpeed || 50;
        this.deleteSpeed = options.deleteSpeed || 30;
        this.waitDelay = options.waitDelay || 2000;
        
        this.phraseIndex = 0;
        this.charIndex = 0;
        this.isDeleting = false;
        this.isWaiting = false;
        
        if (this.element) {
            this.tick();
        }
    }

    tick() {
        const currentPhrase = this.phrases[this.phraseIndex];
        
        if (this.isWaiting) {
            setTimeout(() => {
                this.isWaiting = false;
                this.isDeleting = true;
                this.tick();
            }, this.waitDelay);
            return;
        }

        if (this.isDeleting) {
            this.charIndex--;
            this.element.textContent = currentPhrase.substring(0, this.charIndex);
            
            if (this.charIndex === 0) {
                this.isDeleting = false;
                this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
                this.tick();
            } else {
                setTimeout(() => this.tick(), this.deleteSpeed);
            }
        } else {
            this.charIndex++;
            this.element.textContent = currentPhrase.substring(0, this.charIndex);
            
            if (this.charIndex === currentPhrase.length) {
                this.isWaiting = true;
                this.tick();
            } else {
                setTimeout(() => this.tick(), this.typeSpeed);
            }
        }
    }
}

class ScrollSpy {
    constructor() {
        this.sections = document.querySelectorAll('section');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.init();
    }

    init() {
        if (this.sections.length === 0) return;
        
        window.addEventListener('scroll', Utils.throttle(this.handleScroll.bind(this), 100));
        this.handleScroll(); 
    }

    handleScroll() {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + (window.innerHeight / 3);

        this.sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionBottom = sectionTop + sectionHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                currentSectionId = section.getAttribute('id');
            }
        });

        if (currentSectionId) {
            this.updateNav(currentSectionId);
        }
    }

    updateNav(id) {
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
                link.classList.add('active');
            }
        });
    }
}

class ClockController {
    constructor() {
        this.el = document.getElementById('sys-clock');
        if (this.el) {
            this.start();
        }
    }

    start() {
        const update = () => {
            const now = new Date();
            this.el.innerText = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        };
        update();
        setInterval(update, 1000);
    }
}

class MobileMenuController {
    constructor() {
        this.toggle = document.getElementById('mobile-menu-toggle');
        this.sidebar = document.getElementById('main-sidebar');
        this.links = document.querySelectorAll('.nav-link');
        this.isOpen = false;

        if (this.toggle && this.sidebar) {
            this.init();
        }
    }

    init() {
        this.toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });

        document.addEventListener('click', (e) => {
            if (this.isOpen && 
                !this.sidebar.contains(e.target) && 
                !this.toggle.contains(e.target)) {
                this.closeMenu();
            }
        });

        this.links.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMenu();
            });
        });
    }

    toggleMenu() {
        this.isOpen = !this.isOpen;
        this.updateState();
    }

    closeMenu() {
        this.isOpen = false;
        this.updateState();
    }

    updateState() {
        if (this.isOpen) {
            this.sidebar.classList.add('mobile-active');
            this.toggle.classList.add('active');
        } else {
            this.sidebar.classList.remove('mobile-active');
            this.toggle.classList.remove('active');
        }
    }
}

class Application {
    constructor() {
        this.input = new InputHandler();
        this.ann = new NeuralNetworkSystem();
        this.bg = new BackgroundSystem();
        this.scrollSpy = new ScrollSpy();
        this.clock = new ClockController();
        this.mobileMenu = new MobileMenuController();
        
        this.running = false;
    }

    boot() {
        this.initTypewriters();
        this.initSmoothScroll();
        this.initGlitchEffects();
        this.startLoop();
    }

    initTypewriters() {
        const roleTypewriter = document.getElementById('sidebar-role-typewriter');
        if (roleTypewriter && typeof Typed !== 'undefined') {
            new Typed('#sidebar-role-typewriter', {
                strings: ['ML Engineer', 'Data Scientist', 'M.Tech Scholar', 'Python Dev'],
                typeSpeed: 50,
                backSpeed: 30,
                loop: true,
                showCursor: true,
                cursorChar: '|'
            });
        } else if (roleTypewriter) {
            new TypingEngine('sidebar-role-typewriter', [
                'ML Engineer', 'Data Scientist', 'M.Tech Scholar', 'Python Dev'
            ]);
        }

        const heroTypewriter = document.getElementById('hero-typewriter');
        if (heroTypewriter && typeof Typed !== 'undefined') {
            new Typed('#hero-typewriter', {
                strings: [
                    'MACHINE LEARNING ENGINEER', 
                    'DEEP LEARNING RESEARCHER', 
                    'COMPUTER VISION SPECIALIST',
                    'AI ENTHUSIAST'
                ],
                typeSpeed: 40,
                backSpeed: 20,
                startDelay: 1000,
                backDelay: 2000,
                loop: true,
                showCursor: true,
                cursorChar: '_'
            });
        } else if (heroTypewriter) {
             new TypingEngine('hero-typewriter', [
                'MACHINE LEARNING ENGINEER', 
                'DEEP LEARNING RESEARCHER', 
                'COMPUTER VISION SPECIALIST'
            ], { waitDelay: 3000 });
        }
    }

    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                const target = document.querySelector(targetId);
                if (target) {
                    const offset = CONFIG.core.isMobile ? 80 : 0;
                    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({
                        top: top,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    initGlitchEffects() {
        const glitchElements = document.querySelectorAll('.glitch-text');
        glitchElements.forEach(el => {
            el.addEventListener('mouseover', () => {
                if(!el.hasAttribute('data-text')) {
                    el.setAttribute('data-text', el.innerText);
                }
            });
        });
    }

    update() {
        STATE.time.now = performance.now();
        STATE.time.delta = STATE.time.now - STATE.time.last;
        
        this.ann.update();
        this.bg.update();
        
        STATE.time.last = STATE.time.now;
        STATE.time.elapsed += STATE.time.delta;
    }

    draw() {
        this.ann.draw();
        this.bg.draw();
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    startLoop() {
        this.running = true;
        this.loop();
    }
}

class TerminalSimulator {
    constructor() {
        this.init();
    }
    
    init() {
        console.log(`%c SYSTEM BOOT SEQUENCE INITIATED...`, 'color: #00f0ff; font-weight: bold;');
        console.log(`%c LOADING KERNEL... [OK]`, 'color: #00ff9d;');
        console.log(`%c MOUNTING FILE SYSTEMS... [OK]`, 'color: #00ff9d;');
        console.log(`%c INITIALIZING NEURAL ENGINE... [OK]`, 'color: #ff0055;');
        console.log(`%c WELCOME TO ABHISHEK KUMAR PORTFOLIO V4.2`, 'background: #00f0ff; color: #000; padding: 2px 5px; font-weight: bold;');
    }
}

const App = new Application();
const Terminal = new TerminalSimulator();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.boot());
} else {
    App.boot();
}

window.App = App;
window.STATE = STATE;
window.CONFIG = CONFIG;

window.addEventListener('scroll', () => {
    if (window.scrollY > CONFIG.ui.scrollThreshold) {
        document.body.classList.add('scrolled-down');
    } else {
        document.body.classList.remove('scrolled-down');
    }
});
