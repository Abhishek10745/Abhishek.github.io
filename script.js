// ==============================
// Typing Animation
// ==============================
const typingElement = document.querySelector(".typing-text");

const roles = [
    "Machine Learning Engineer",
    "AI Developer",
    "Python Developer",
    "Data Science Enthusiast"
];

let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
    const currentRole = roles[roleIndex];

    if (isDeleting) {
        typingElement.textContent = currentRole.substring(0, charIndex--);
    } else {
        typingElement.textContent = currentRole.substring(0, charIndex++);
    }

    let speed = isDeleting ? 50 : 100;

    if (!isDeleting && charIndex === currentRole.length) {
        speed = 1500;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        speed = 500;
    }

    setTimeout(typeEffect, speed);
}

typeEffect();


// ==============================
// Scroll Reveal Animation
// ==============================
const revealElements = document.querySelectorAll(
    ".section, .project-card, .skill-card, .contact-card"
);

function revealOnScroll() {
    const windowHeight = window.innerHeight;

    revealElements.forEach(el => {
        const elementTop = el.getBoundingClientRect().top;

        if (elementTop < windowHeight - 100) {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
        }
    });
}

window.addEventListener("scroll", revealOnScroll);

// Initial hidden state
revealElements.forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "translateY(40px)";
    el.style.transition = "all 0.8s ease";
});


// ==============================
// Navbar Background on Scroll
// ==============================
const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
        navbar.style.background = "rgba(0,0,0,0.6)";
        navbar.style.backdropFilter = "blur(15px)";
    } else {
        navbar.style.background = "rgba(255,255,255,0.05)";
    }
});


// ==============================
// Smooth Scrolling for Nav Links
// ==============================
document.querySelectorAll(".nav-links a").forEach(anchor => {
    anchor.addEventListener("click", function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        target.scrollIntoView({ behavior: "smooth" });
    });
});


// ==============================
// Floating Orb Dynamic Motion
// ==============================
const orb = document.querySelector(".ai-orb");

document.addEventListener("mousemove", (e) => {
    const x = (window.innerWidth / 2 - e.pageX) / 40;
    const y = (window.innerHeight / 2 - e.pageY) / 40;

    orb.style.transform = `translate(${x}px, ${y}px)`;
});
