// Файл main.js

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const backToTopButton = document.getElementById('back-to-top-button');
    const accordionItems = document.querySelectorAll('.accordion-item');
    const fadeInElements = document.querySelectorAll('.fade-in');
    const navLinks = document.querySelectorAll('a[href^="#"]');
    const mainHeader = document.getElementById('main-header');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    // --- Мобильное меню ---
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Закрытие мобильного меню при клике на ссылку
    mobileMenu.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            mobileMenu.classList.add('hidden');
        }
    });

    // --- Анимации при прокрутке (fade-in) ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    fadeInElements.forEach(el => observer.observe(el));

    // --- Логика аккордеона FAQ ---
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        header.addEventListener('click', () => {
            // Закрываем все остальные аккордеоны
            accordionItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('open')) {
                    otherItem.classList.remove('open');
                }
            });
            // Открываем/закрываем текущий
            item.classList.toggle('open');
        });
    });

    // --- Плавная прокрутка для навигационных ссылок ---
    navLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = mainHeader.offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Обработка скролла страницы ---
    const handleScroll = () => {
        // Кнопка "Наверх"
        if (backToTopButton) {
            if (window.scrollY > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        }
        // Тень для хедера
         if (mainHeader) {
            if (window.scrollY > 20) {
                mainHeader.classList.add('scrolled');
            } else {
                mainHeader.classList.remove('scrolled');
            }
        }
    };
    
    window.addEventListener('scroll', handleScroll);

    if (backToTopButton) {
        backToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
