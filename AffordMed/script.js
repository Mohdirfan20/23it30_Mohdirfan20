
let localNotifications = [];


let currentPage = 1;
let pageSize = 10;


document.addEventListener("DOMContentLoaded", () => {

    if (typeof notifications !== "undefined") {
        localNotifications = [...notifications];
    } else {
        console.error("Notifications data could not be loaded.");
    }


    loadStateFromURL();


    document.getElementById("searchInput").addEventListener("input", () => {
        currentPage = 1;
        updateURL();
        render();
    });

    document.getElementById("filterType").addEventListener("change", () => {
        currentPage = 1;
        updateURL();
        render();
    });

    document.getElementById("limitCount").addEventListener("change", (e) => {
        currentPage = 1;
        const val = e.target.value;
        pageSize = val === "all" ? localNotifications.length : parseInt(val, 10);
        updateURL();
        render();
    });

    document.getElementById("prevBtn").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            updateURL();
            render();
        }
    });

    document.getElementById("nextBtn").addEventListener("click", () => {
        const totalItems = getFilteredAndSortedNotifications().length;
        const totalPages = Math.ceil(totalItems / pageSize) || 1;
        if (currentPage < totalPages) {
            currentPage++;
            updateURL();
            render();
        }
    });


    document.getElementById("closeModal").addEventListener("click", closeModal);


    window.addEventListener("click", (e) => {
        const modal = document.getElementById("notificationModal");
        if (e.target === modal) {
            closeModal();
        }
    });


    render();
});


function loadStateFromURL() {
    const params = new URLSearchParams(window.location.search);


    const searchVal = params.get("q") || "";
    document.getElementById("searchInput").value = searchVal;


    const typeVal = params.get("notifications_type") || "all";
    if (["all", "Urgent", "Info", "Reminder"].includes(typeVal)) {
        document.getElementById("filterType").value = typeVal;
    }


    const countVal = params.get("count") || "10";
    if (["10", "15", "20", "50", "all"].includes(countVal)) {
        document.getElementById("limitCount").value = countVal;
        pageSize = countVal === "all" ? localNotifications.length : parseInt(countVal, 10);
    } else {
        pageSize = 10;
    }


    const pageVal = parseInt(params.get("page_n"), 10);
    if (!isNaN(pageVal) && pageVal > 0) {
        currentPage = pageVal;
    } else {
        currentPage = 1;
    }
}


function updateURL() {
    const params = new URLSearchParams();

    const searchVal = document.getElementById("searchInput").value.trim();
    if (searchVal) {
        params.set("q", searchVal);
    }

    const typeVal = document.getElementById("filterType").value;
    if (typeVal !== "all") {
        params.set("notifications_type", typeVal);
    }

    const countVal = document.getElementById("limitCount").value;
    if (countVal !== "10") {
        params.set("count", countVal);
    }

    if (currentPage > 1) {
        params.set("page_n", currentPage);
    }

    const newRelativePathQuery = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
    window.history.replaceState({}, "", newRelativePathQuery);
}


function getFilteredAndSortedNotifications() {

    let data = getUnreadNotifications(localNotifications);

    const searchVal = document.getElementById("searchInput").value.toLowerCase().trim();
    if (searchVal) {
        data = data.filter(item =>
            item.title.toLowerCase().includes(searchVal) ||
            item.type.toLowerCase().includes(searchVal) ||
            (item.summary && item.summary.toLowerCase().includes(searchVal))
        );
    }


    const typeVal = document.getElementById("filterType").value;
    if (typeVal !== "all") {
        data = data.filter(item => item.type === typeVal);
    }


    return sortNotifications(data);
}


function render() {
    const listContainer = document.getElementById("notificationList");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const pageInfo = document.getElementById("pageInfo");


    updateStatistics();


    const filteredNotifications = getFilteredAndSortedNotifications();
    const totalItems = filteredNotifications.length;


    const limitVal = document.getElementById("limitCount").value;
    pageSize = limitVal === "all" ? totalItems || 1 : parseInt(limitVal, 10);


    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const pageItems = filteredNotifications.slice(startIdx, endIdx);


    listContainer.innerHTML = "";
    if (pageItems.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <p class="empty-icon">📭</p>
                <h3>No unread notifications found</h3>
                <p>Try modifying your search query or filters.</p>
            </div>
        `;
    } else {
        pageItems.forEach((notification) => {
            const score = calculatePriority(notification);

            const card = document.createElement("div");
            card.className = `card border-${notification.type.toLowerCase()}`;
            card.innerHTML = `
                <div class="card-header-row">
                    <h3 class="card-title">${notification.title}</h3>
                    <span class="badge badge-${notification.type.toLowerCase()}">${notification.type}</span>
                </div>
                <p class="card-summary">${notification.summary || 'No summary available.'}</p>
                <div class="card-footer-row">
                    <span class="card-time"><i class="icon-clock">⏱</i> ${notification.time} mins ago</span>
                    <span class="card-score">Priority Score: <span class="score-num">${score}</span></span>
                </div>
            `;


            card.addEventListener("click", () => openModal(notification));
            listContainer.appendChild(card);
        });
    }


    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || limitVal === "all";

    if (totalItems === 0) {
        pageInfo.textContent = "Page 0 of 0";
    } else {
        const showingStart = startIdx + 1;
        const showingEnd = Math.min(endIdx, totalItems);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages} (Showing ${showingStart}-${showingEnd} of ${totalItems})`;
    }
}


function updateStatistics() {
    const unreadList = getUnreadNotifications(localNotifications);

    const totalUnread = unreadList.length;
    const urgentCount = unreadList.filter(item => item.type === "Urgent").length;
    const infoCount = unreadList.filter(item => item.type === "Info").length;
    const reminderCount = unreadList.filter(item => item.type === "Reminder").length;


    const totalUnreadEl = document.getElementById("statTotalUnread");
    const urgentEl = document.getElementById("statUrgent");
    const infoEl = document.getElementById("statInfo");
    const reminderEl = document.getElementById("statReminder");

    if (totalUnreadEl) totalUnreadEl.textContent = totalUnread;
    if (urgentEl) urgentEl.textContent = urgentCount;
    if (infoEl) infoEl.textContent = infoCount;
    if (reminderEl) reminderEl.textContent = reminderCount;
}


function openModal(notification) {
    const modal = document.getElementById("notificationModal");
    const detailsContainer = document.getElementById("modalDetails");


    const priorityValues = { Urgent: 3, Info: 2, Reminder: 1 };
    const basePriorityWeight = priorityValues[notification.type] || 0;
    const weightComponent = basePriorityWeight * 100;
    const recencyComponent = 100 - notification.time;
    const totalScore = weightComponent + recencyComponent;

    detailsContainer.innerHTML = `
        <h2 id="modalTitle">🔔 Notification Breakdown</h2>
        
        <div class="modal-section">
            <h4>Title</h4>
            <p class="modal-title-text">${notification.title}</p>
        </div>

        <div class="modal-section">
            <h4>Description</h4>
            <p class="modal-summary-text">${notification.summary || 'No summary available.'}</p>
        </div>

        <div class="modal-meta-row">
            <div class="meta-item">
                <h4>Category</h4>
                <span class="badge badge-${notification.type.toLowerCase()}">${notification.type}</span>
            </div>
            <div class="meta-item">
                <h4>Recency</h4>
                <p class="meta-time-text">⏱ ${notification.time} minutes ago</p>
            </div>
        </div>

        <div class="modal-section">
            <h4>Priority Calculation Formula</h4>
            <div class="formula-box">
                <code>Priority Score = (Weight &times; 100) + (100 - Time)</code>
            </div>
            <div class="score-breakdown">
                <div class="score-breakdown-row">
                    <span>Base Weight (<strong>${notification.type}</strong>):</span>
                    <span>${basePriorityWeight} &times; 100 = <strong>+${weightComponent}</strong> pts</span>
                </div>
                <div class="score-breakdown-row">
                    <span>Recency Component (100 - <strong>${notification.time}m</strong>):</span>
                    <span>100 - ${notification.time} = <strong>+${recencyComponent}</strong> pts</span>
                </div>
                <div class="score-breakdown-row total">
                    <span>Final Calculated Score:</span>
                    <span class="final-score-num">${totalScore} pts</span>
                </div>
            </div>
        </div>

        <div class="modal-actions">
            <button class="btn-mark-read" id="btnMarkRead">✓ Mark as Read</button>
            <button class="btn-close" id="btnCloseModal">Close</button>
        </div>
    `;


    document.getElementById("btnMarkRead").addEventListener("click", () => {
        markAsRead(notification.notificationId);
    });

    document.getElementById("btnCloseModal").addEventListener("click", closeModal);


    modal.classList.add("show");
}

function closeModal() {
    const modal = document.getElementById("notificationModal");
    modal.classList.remove("show");
}


function markAsRead(notificationId) {
    const index = localNotifications.findIndex(item => item.notificationId === notificationId);
    if (index !== -1) {
        localNotifications[index].isRead = true;
        closeModal();
        render();
    }
}
