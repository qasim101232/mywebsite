// =========================================================
// MOODLE CONFIG
// =========================================================
const MOODLE_CONFIG = {
    baseUrl: 'http://127.0.0.1',
    token: '8550abe11b5d1df478f5fff5a03816ee'
    // courseId hata diya — ab saare courses aayenge
};

// =========================================================
// API CALL HELPER
// =========================================================
async function moodleApi(wsfunction, params = {}) {
    const url = new URL(`${MOODLE_CONFIG.baseUrl}/webservice/rest/server.php`);
    url.searchParams.append('wstoken', MOODLE_CONFIG.token);
    url.searchParams.append('wsfunction', wsfunction);
    url.searchParams.append('moodlewsrestformat', 'json');

    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

    console.log('🔗 API:', wsfunction, params);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data && data.exception) {
        throw new Error(data.message);
    }
    return data;
}

// =========================================================
// SAARE COURSES LOAD KARO
// =========================================================
async function loadAllCourses() {
    const status = document.getElementById('status');
    const stats = document.getElementById('stats');
    const grid = document.getElementById('coursesGrid');

    try {
        // Moodle se saare courses mangwao
        const courses = await moodleApi('core_course_get_courses');

        if (!courses || courses.length === 0) {
            throw new Error('Koi course nahi mila');
        }

        // "Site home" course (ID=1) hata do
        const visibleCourses = courses.filter(c => c.id !== 1);

        // Status
        status.className = 'status success';
        status.innerHTML = `✅ <strong>${visibleCourses.length} courses</strong> mile Moodle se`;

        // Stats
        stats.style.display = 'grid';
        stats.innerHTML = `
            <div class="stat-card">
                <i class="fas fa-book"></i>
                <h3>${visibleCourses.length}</h3>
                <p>Total Courses</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-eye"></i>
                <h3>${visibleCourses.filter(c => c.visible).length}</h3>
                <p>Visible</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-hashtag"></i>
                <h3>${visibleCourses.map(c => c.id).join(', ')}</h3>
                <p>Course IDs</p>
            </div>
        `;

        // Course cards render karo
        grid.innerHTML = visibleCourses.map(course => `
            <div class="course-card" onclick="openCourse(${course.id}, '${escapeAttr(course.fullname)}')">
                <div class="course-banner">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <div class="course-body">
                    <div class="shortname">${escapeHtml(course.shortname || 'COURSE')}</div>
                    <h3>${escapeHtml(course.fullname)}</h3>
                    <div class="course-meta">
                        <span><i class="fas fa-hashtag"></i> ID: ${course.id}</span>
                        <span><i class="fas fa-eye"></i> ${course.visible ? 'Visible' : 'Hidden'}</span>
                    </div>
                </div>
            </div>
        `).join('');

        console.log(`✅ ${visibleCourses.length} courses loaded`);

    } catch (error) {
        console.error('❌ Error:', error);
        status.className = 'status error';
        status.innerHTML = `❌ Error: ${error.message}`;
    }
}

// =========================================================
// COURSE KHOLO — Uske sections load karo
// =========================================================
async function openCourse(courseId, courseName) {
    const modal = document.getElementById('courseModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');

    modal.classList.add('active');
    title.textContent = courseName;
    body.innerHTML = '<p style="text-align:center; padding:30px; color:#888;">⏳ Loading content...</p>';

    try {
        const sections = await moodleApi('core_course_get_contents', { courseid: courseId });

        if (!sections || sections.length === 0) {
            body.innerHTML = '<p style="text-align:center; padding:30px; color:#aaa;">Course empty hai</p>';
            return;
        }

        body.innerHTML = sections.map(section => {
            const modules = section.modules || [];

            const modulesHtml = modules.length > 0
                ? modules.map(m => {
                    let icon = 'fa-file-alt';
                    if (m.modname === 'forum')     icon = 'fa-comments';
                    if (m.modname === 'quiz')      icon = 'fa-question-circle';
                    if (m.modname === 'assign')    icon = 'fa-tasks';
                    if (m.modname === 'resource')  icon = 'fa-download';
                    if (m.modname === 'url')       icon = 'fa-link';
                    if (m.modname === 'page')      icon = 'fa-file';
                    if (m.modname === 'folder')    icon = 'fa-folder';
                    if (m.modname === 'book')      icon = 'fa-book';

                    return `
                        <div class="lecture-item" onclick="openActivity('${m.url || ''}')">
                            <span><i class="fas ${icon}"></i> ${escapeHtml(m.name)}</span>
                            <span class="tag">${m.modname}</span>
                        </div>
                    `;
                }).join('')
                : '<div class="empty-msg">— Is section mein koi content nahi —</div>';

            return `
                <div class="section-box">
                    <h4><i class="fas fa-folder-open"></i> ${escapeHtml(section.name)}</h4>
                    ${modulesHtml}
                </div>
            `;
        }).join('');

    } catch (error) {
        body.innerHTML = `<p style="color:red; padding:20px;">Error: ${error.message}</p>`;
    }
}

// =========================================================
// ACTIVITY KHOLEIN — Moodle URL par le jao
// =========================================================
function openActivity(url) {
    if (url && url !== '') {
        window.open(url, '_blank');
    }
}

// =========================================================
// MODAL CLOSE
// =========================================================
function closeModal() {
    document.getElementById('courseModal').classList.remove('active');
}

// Modal background click
document.addEventListener('click', (e) => {
    if (e.target.id === 'courseModal') closeModal();
});

// ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// =========================================================
// HELPERS
// =========================================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    if (!text) return '';
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// =========================================================
// INIT
// =========================================================
document.addEventListener('DOMContentLoaded', loadAllCourses);