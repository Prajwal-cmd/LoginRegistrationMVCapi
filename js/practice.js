let currentEmployeesState = {
    departmentId: null,
    pageSize: 10,
    isLoading: false,
    lastHireDate: null,
    lastId: null,
    hasMore: true
};

let observer;

function setupInfiniteScroll() {
    const employeeContainer = $('#employeeContainer')[0];
    const sentinel = $('#loadingIndicator')[0];

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting &&
                !currentEmployeesState.isLoading &&
                currentEmployeesState.hasMore) {
                loadNextPage();
            }
        });
    }, {
        root: employeeContainer,
        rootMargin: '0px 0px 50px 0px',
        threshold: 0
    });

    observer.observe(sentinel);
}

function initializePractice() {
    fetchDepartments();
    setupInfiniteScroll();
}

function fetchDepartments() {
    $.ajax({
        type: 'GET',
        url: 'https://localhost:7123/api/Practice/departments',
        dataType: 'json',
        success: function (departments) {
            const list = $('#departmentList');
            list.empty();
            departments.forEach(dept => {
                const li = $('<li>');
                const link = $('<a>')
                    .attr('href', '#')
                    .text(dept.name)
                    .on('click', function (e) {
                        e.preventDefault();
                        fetchAndDisplayEmployees(dept.id);
                    });
                li.append(link);
                list.append(li);
            });
        },
        error: function (xhr, status, error) {
            console.error('Error fetching departments:', error);
            alert('Failed to load departments');
        }
    });
}

function fetchAndDisplayEmployees(id) {
    currentEmployeesState.departmentId = id;
    currentEmployeesState.lastHireDate = null;
    currentEmployeesState.lastId = null;
    currentEmployeesState.hasMore = true;
    currentEmployeesState.isLoading = false;

    // Change target to the new table body
    $('#employeeTableBody').empty();
    $('#loadingIndicator').show().text("Loading more employees...");
    $('#employeeContainer').scrollTop(0);

    if (observer) observer.disconnect();
    setupInfiniteScroll();

    $.ajax({
        type: 'GET',
        url: `https://localhost:7123/api/Practice/department/${id}`,
        dataType: 'json',
        success: function (data) {
            $('#departmentDetails h3').text(`${data.name} Details`);
            $('#departmentDetails p').text(`Description: ${data.description}`);
            loadNextPage();
        },
        error: function (xhr, status, error) {
            console.error('Error fetching department details:', error);
            alert('Failed to load department details');
        }
    });
}

function loadNextPage() {
    if (!currentEmployeesState.hasMore) {
        $('#loadingIndicator').html('No more employees to load.');
        if (observer) observer.disconnect();
        return;
    }

    currentEmployeesState.isLoading = true;
    $('#loadingIndicator').show().text("Loading more employees...");

    const queryParams = {
        pageSize: currentEmployeesState.pageSize,
        lastHireDate: currentEmployeesState.lastHireDate,
        lastId: currentEmployeesState.lastId
    };

    $.ajax({
        type: 'GET',
        url: `https://localhost:7123/api/Practice/department/${currentEmployeesState.departmentId}/employees`,
        data: queryParams,
        dataType: 'json',
        success: function (pagedResult) {
            currentEmployeesState.isLoading = false;
            // Change target to the new table body
            const employeeTableBody = $('#employeeTableBody');

            if (pagedResult.items && pagedResult.items.length > 0) {
                const lastItem = pagedResult.items[pagedResult.items.length - 1];
                currentEmployeesState.lastHireDate = lastItem.hireDate;
                currentEmployeesState.lastId = lastItem.id;

                pagedResult.items.forEach(emp => {
                    // Append table rows instead of list items
                    employeeTableBody.append(`
                        <tr>
                            <td>${emp.name}</td>
                            <td>${emp.position}</td>
                            <td>${emp.salary}</td>
                            <td>${new Date(emp.hireDate).toLocaleDateString()}</td>
                        </tr>
                    `);
                });

                if (pagedResult.items.length < currentEmployeesState.pageSize) {
                    currentEmployeesState.hasMore = false;
                    $('#loadingIndicator').html('No more employees to load.');
                }
            } else {
                currentEmployeesState.hasMore = false;
                // Update empty state for the table body
                if (employeeTableBody.is(':empty')) {
                    employeeTableBody.html('<tr><td colspan="4">No employees found for this department.</td></tr>');
                }
                $('#loadingIndicator').html('No more employees to load.');
            }
        },
        error: function (xhr, status, error) {
            console.error('Error fetching employees:', error);
            alert('Failed to load employees');
            currentEmployeesState.isLoading = false;
            $('#loadingIndicator').hide();
        }
    });
}