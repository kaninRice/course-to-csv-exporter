function addCourseToList() {

};

function removeCourseFromList() {

};

function clearCourseList() {

};

function exportCourseList() {

};

browser.runtime.onMessage.addListener((mes) => {
    switch (mes.action) {
        case 'addCourseToList':
            break;
        case 'removeCourseFromList':
            break;
        case 'clearCourseList':
            break;
        default: // no default action
            break;
    }
})