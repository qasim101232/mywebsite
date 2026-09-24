// Courses Data
const coursesData = [
    {
        id: 1,
        title: "Complete Web Development Bootcamp",
        category: "web",
        image: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=500",
        instructor: "Sarah Johnson",
        lessons: 45,
        duration: "12h",
        rating: 4.8,
        price: 49,
        oldPrice: 99
    },
    {
        id: 2,
        title: "Python for Data Science",
        category: "data",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500",
        instructor: "Michael Chen",
        lessons: 38,
        duration: "10h",
        rating: 4.9,
        price: 59,
        oldPrice: 119
    },
    {
        id: 3,
        title: "UI/UX Design Masterclass",
        category: "design",
        image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500",
        instructor: "Emily Davis",
        lessons: 32,
        duration: "8h",
        rating: 4.7,
        price: 45,
        oldPrice: 89
    },
    {
        id: 4,
        title: "Digital Marketing Complete Guide",
        category: "marketing",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500",
        instructor: "David Miller",
        lessons: 28,
        duration: "7h",
        rating: 4.6,
        price: 39,
        oldPrice: 79
    },
    {
        id: 5,
        title: "React JS - Zero to Hero",
        category: "web",
        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500",
        instructor: "Sarah Johnson",
        lessons: 40,
        duration: "11h",
        rating: 4.9,
        price: 55,
        oldPrice: 109
    },
    {
        id: 6,
        title: "Machine Learning A-Z",
        category: "data",
        image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500",
        instructor: "Michael Chen",
        lessons: 50,
        duration: "15h",
        rating: 4.8,
        price: 69,
        oldPrice: 139
    }
];

// Render Courses
const coursesGrid = document.getElementById('coursesGrid');

function renderCourses(filter = 'all') {
    const filtered = filter === 'all' 
        ? coursesData 
        : coursesData.filter(c => c.category === filter);

    coursesGrid.innerHTML = filtered.map(course => `
        <div class="course-card">
            <div class="course-img">
                <img src="${course.image}" alt="${course.title}">
                <span class="course-tag">${course.category}</span>
            </div>
            <div class="course-body">
                <h3>${course.title}</h3>
                <div class="course-meta">
                    <span><i class="fas fa-user"></i>${course.instructor}</span>
                    <span><i class="fas fa-clock"></i>${course.duration}</span>
                </div>
                <div class="course-meta">
                    <span><i class="fas fa-book"></i>${course.lessons} Lessons</span>
                    <span><i class="fas fa-star" style="color:#ffb400;"></i>${course.rating}</span>
                </div>
                <div class="course-footer">
                    <div class="course-price">$${course.price}<span>$${course.oldPrice}</span></div>
                    <a href="#" class="btn-enroll">Enroll Now</a>
                </div>
            </div>
        </div>
    `).join('');
}

renderCourses();

// Filter Buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCourses(btn.dataset.filter);
    });
});

// Mobile Menu
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => navMenu.classList.remove('active'));
});

// Contact Form
document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('✅ Thank you! Your message has been sent successfully.');
    e.target.reset();
});

// Newsletter
document.querySelector('.newsletter').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('✅ Subscribed successfully!');
    e.target.reset();
});

// Scroll Animation
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .course-card, .instructor-card, .info-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 25px rgba(0,0,0,0.1)';
    } else {
        navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.05)';
    }
});