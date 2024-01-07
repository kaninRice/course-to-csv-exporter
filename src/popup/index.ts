const courseList = document.querySelector('course-list');
const addBtn = document.querySelector('add-btn');
const clearBtn = document.querySelector('clear-btn');
const exportBtn = document.querySelector('export-btn');

function initScript() {
    addSavedCourse();
    addBtnListener();
};

async function sendMessage(action: string, target?: string) {
    const currentTab = await browser.tabs.query({ active: true, currentWindow: true });

    if (currentTab[0] == undefined || currentTab[0].id == undefined) return;

    browser.tabs.sendMessage(currentTab[0].id, {
        message: action,
        target: target || null
    });
};

function addBtnListener() {
    addBtn?.addEventListener('click', () => {
        sendMessage('addCourse')
    });

    clearBtn?.addEventListener('click', () => {
        sendMessage('clearCourseList');
    });

    exportBtn?.addEventListener('click', () => {
        // TODO: export function
    });
}

async function addSavedCourse() {
    if (!courseList) return;
    courseList.innerHTML = '';

    const { course_list } = await browser.storage.local.get('course_list');

    if(!course_list) return;
    Object.values(course_list).forEach((course) => {
        courseList.innerHTML += `<li class="course-item">${course}</li>`;
    })

    updateListItemListeners();
}

function updateListItemListeners() {
    const courseListItems = document.querySelectorAll('course-item');

    courseListItems.forEach((courseItem) => {
        courseItem.addEventListener('click', () => {
            sendMessage('removeCourse', `${courseItem.textContent}`)
        });
    })
}

function reportError(err: Error) {
    console.error(err.message);
};

browser.tabs
    .executeScript({ file: 'exporter.js' })
    .then(initScript)
    .catch(reportError);