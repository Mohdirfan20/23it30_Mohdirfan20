
const priorityMap = {
    Urgent: 3,
    Info: 2,
    Reminder: 1
};


function calculatePriority(notification) {
    const priority = priorityMap[notification.type] || 0;


    const recencyScore = 100 - notification.time;

    return (priority * 100) + recencyScore;
}


function getUnreadNotifications(data) {
    return data.filter(notification => !notification.isRead);
}


function sortNotifications(data) {
    return data.sort((a, b) => {
        return calculatePriority(b) - calculatePriority(a);
    });
}


function getTopNotifications(data, count = 10) {
    return data.slice(0, count);
}