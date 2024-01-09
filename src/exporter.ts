interface Schedule {
    day_first: string;
    time_first: string;
    room_first: string;
    day_second?: string;
    time_second?: string;
    room_second?: string;
}

interface Section {
    class_number: number;
    section: string;
    schedule?: Schedule;
    remarks?: string;
    prof?: string;
}

async function addCourse() {
    const table: HTMLTableElement | null = document.querySelector('form table');
    if (table?.children === undefined) return;

    let courseName: string = '';
    const sectionArray = [];
    let runningSection: Section = {
        class_number: -1,
        section: '',
    };

    // get sections from table
    for (const row of table.tBodies[0].rows) {
        // ignore header row
        if (row.children[0].getAttribute('bgcolor') == '#338000') continue;

        // row contains new section
        if (row.children[0].getAttribute('bgcolor') == '#D2EED3') {
            // append previous section to section array
            if (runningSection.class_number != -1) {
                sectionArray.push(runningSection);
            }

            // reset runningSection
            runningSection = {
                class_number: -1,
                section: '',
            };

            // set new values
            if (courseName == '') {
                courseName = row.children[1].textContent!.substring(1).trim();
            }

            runningSection.class_number = row.children[0]
                .textContent!.substring(1)
                .trim() as unknown as number;
            runningSection.section = row.children[2]
                .textContent!.substring(1)
                .trim();

            runningSection.schedule = {
                day_first: row.children[3].textContent!.substring(1).trim(),
                time_first: row.children[4].textContent!.substring(1).trim(),
                room_first: row.children[5].textContent!.substring(1).trim(),
            };

            if (row.children[8].textContent) {
                runningSection.remarks = row.children[8].textContent
                    .substring(1)
                    .trim();
            }

            // row contains data for the previous row's section
        } else {
            // row contains second day sched
            if (row.children.length > 1) {
                runningSection.schedule!.day_second = row.children[3]
                    .textContent!.substring(1)
                    .trim();
                runningSection.schedule!.time_second = row.children[4]
                    .textContent!.substring(1)
                    .trim();
                runningSection.schedule!.room_second = row.children[5]
                    .textContent!.substring(1)
                    .trim();

                // row contains prof name
            } else {
                runningSection.prof = row.children[0].textContent!.trim();
            }
        }
    }

    // add last section to array
    sectionArray.push(runningSection);

    // add course to local storage
    const { course_list } = await browser.storage.local.get('course_list');
    let tmpCourseList: string[] = [];

    course_list === undefined
        ? (tmpCourseList = [courseName])
        : (tmpCourseList = [courseName, ...course_list]);

    // remove duplicate
    tmpCourseList = [...new Set(tmpCourseList)];

    const courseList = { course_list: tmpCourseList };
    browser.storage.local.set(courseList);

    const sectionList = { [courseName]: sectionArray };
    browser.storage.local.set(sectionList);

    // send message to popup to update course list
    browser.runtime.sendMessage({});
}

async function removeCourse(target: string) {
    const { course_list } = await browser.storage.local.get('course_list');

    // remove course from course list
    const courseIndex = course_list.indexOf(target);
    if (courseIndex > -1) {
        course_list.splice(courseIndex, 1);
    }

    const courseList = { course_list: course_list };
    browser.storage.local.set(courseList);

    // remove course section list
    browser.storage.local.remove(`${target}`);

    return browser.runtime.sendMessage({});
}

function clearCourseList() {
    browser.storage.local.clear();
    return browser.runtime.sendMessage({});
}

async function exportCourseList() {
    const { course_list } = await browser.storage.local.get('course_list');
    let csv = 'data:text/csv;charset=utf-8,';
    csv +=
        'Class Number,Course,Section,Day 1, Time 1,Room 1,Day 2, Time 2, Room 2, Remarks,\r\n';

    course_list.forEach(async (courseItem: string) => {
        const data = await browser.storage.local.get(`${courseItem}`);
        const sectionList = Object.values(data)[0];

        sectionList.forEach((section: Section) => {
            const row = 
            `${section.class_number},${courseItem},${section.section}
            ,${section.schedule?.day_first},${section.schedule?.time_first},${section.schedule?.room_first}
            ,${section.schedule?.day_second || ''},${section?.schedule?.time_second || ''},${section.schedule?.room_second || ''}
            ,${section.remarks || ''}`;
            csv += row + '\r\n';
        });

        const encodedUri = encodeURI(csv);
        window.open(encodedUri);
    });
}

browser.runtime.onMessage.addListener((mes) => {
    switch (mes.message) {
        case 'addCourse':
            addCourse();
            break;
        case 'removeCourse':
            if (!mes.target) return;
            removeCourse(mes.target);
            break;
        case 'clearCourseList':
            clearCourseList();
            break;
        case 'exportCourseList':
            exportCourseList();
            break;
        default: // no default action
            break;
    }
});
