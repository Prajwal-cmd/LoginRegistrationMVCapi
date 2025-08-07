window.showLogoutPopup = function (name) {
    if (confirm("Logout, " + name + "?")) {
        window.location.href = "/Account/Logout";
    }
};

$.validator.addMethod("customEmail", function (value, element) {
    if (!value || value.trim() === "") return true;
    var regExp = /^([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
    return regExp.test(value);
}, "Email must be a valid address (e.g., user@domain.com).");

$.validator.addMethod("validDate", function (value, element) {
    if (!value || value.trim() === "") return false;
    var dob = new Date(value);
    return !isNaN(dob.getTime()) && dob < new Date();
}, "Date of Birth must be a valid past date.");


const apiBaseUrl = document.getElementById('hdnApiBaseUrl').value;
const imageBaseUrl = document.getElementById('hdnImageBaseUrl').value;





var connection = null;
var myUserName = null;

function initializeChat() {
    // Get the SignalR hub URL from configuration
    var signalRHubUrl = "https://localhost:7123/chathub"; // Your API URL + /chathub

    // Create new SignalR connection (ASP.NET Core SignalR)
    connection = new signalR.HubConnectionBuilder()
        .withUrl(signalRHubUrl + "?userName=" + encodeURIComponent(myUserName), {
            withCredentials: false
        })
        .build();

    // Define client methods
    connection.on("ReceiveError", function (errorMessage) {
        alert(errorMessage);
    });

    connection.on("ReceiveSuccess", function (successMessage) {
        alert(successMessage);
        connection.invoke("RequestChatList", myUserName);
    });

    connection.on("ReceiveMessage", function (chatId, userName, message, timestamp) {
        var selectedChatId = $('#chatSelector').val();
        if (parseInt(selectedChatId) === chatId) {
            var isSent = myUserName === userName;
            var $message = $('<div class="message ' + (isSent ? 'sent' : 'received') + '"><strong>' + userName + ':</strong> ' + message + '<div class="message-timestamp">' + timestamp + '</div></div>');
            $('#messages').append($message);

            var messagesContainer = $('#messages')[0];
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    });

    connection.on("UpdateChatList", function (chats) {
        var $chatSelector = $('#chatSelector');
        // Store the currently selected chat ID
        var currentChatId = $chatSelector.val();
        $chatSelector.empty();
        $chatSelector.append('<option value="0">Select a Chat</option>');
        console.log(chats);
        $.each(chats, function (index, chat) {
            $chatSelector.append('<option value="' + chat.id + '">' + 'Chat ' + chat.id + ' (' + chat.chatType + ')</option>');
        });
        // Restore the previously selected chat ID if it still exists
        if (currentChatId && currentChatId != "0" && chats.some(chat => chat.id == currentChatId)) {
            $chatSelector.val(currentChatId);
        }
    });

    connection.on("UpdateChatHistory", function (messages) {
        var $messages = $('#messages');
        console.log(messages)
        $messages.empty();
        $.each(messages, function (index, message) {
            var isSent = myUserName === message.senderName;
            var $message = $('<div class="message ' + (isSent ? 'sent' : 'received') + '"><strong>' + message.senderName + ':</strong> ' + message.messageText + '<div class="message-timestamp">' + message.timestamp + '</div></div>');
            $messages.append($message);
            var messagesContainer = $('#messages')[0];
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
    });

    function loadChatHistory() {
        var chatId = $('#chatSelector').val();
        if (chatId && chatId != 0) {
            connection.invoke("RequestChatHistory", parseInt(chatId), myUserName);
        } else {
            $('#messages').empty();
        }
    }

    $('#chatSelector').on('change', loadChatHistory);

    // Start the connection
    connection.start().then(function () {
        console.log("SignalR Connected!");
        connection.invoke("RequestChatList", myUserName);

        $('#createChatButton').click(function () {
            var chatType = prompt("Enter chat type (OneOnOne or Group):", "Group");
            if (chatType && (chatType === "OneOnOne" || chatType === "Group")) {
                var participantsInput = prompt("Enter participant usernames (comma-separated):", "");
                if (participantsInput) {
                    var participantUserNames = participantsInput.split(',').map(name => name.trim());
                    connection.invoke("CreateChat", chatType, participantUserNames, myUserName);
                }
            } else {
                alert("Invalid chat type. Use 'OneOnOne' or 'Group'.");
            }
        });

        $('#sendButton').click(function () {
            var chatId = $('#chatSelector').val();
            var message = $('#messageInput').val();
            if (chatId && message && chatId != 0) {
                connection.invoke("SendMessage", parseInt(chatId), message, myUserName);
                $('#messageInput').val('');
            } else {
                alert("Please select a chat and enter a message.");
            }
        });
    }).catch(function (err) {
        console.error('SignalR connection failed: ' + err.toString());
    });
}






function validateForm(config) {
    var isValid = true;
    config.fields.forEach(function (field) {
        var value = $(field.id).val().trim();
        var errorElement = $(field.errorId);

        if (field.required && !value && !field.file) {
            errorElement.text(field.requiredMessage).show();
            isValid = false;
        } else if (field.file) {
            var fileInput = $(field.id)[0];
            var file = fileInput.files && fileInput.files[0];

            if (field.required && !file) {
                errorElement.text(field.requiredMessage).show();
                isValid = false;
            } else if (file) {
                var validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
                var maxSize = 5 * 1024 * 1024;

                if (!validTypes.includes(file.type)) {
                    errorElement.text("Image must be JPEG, PNG, or GIF.").show();
                    isValid = false;
                } else if (file.size > maxSize) {
                    errorElement.text("Image size must not exceed 5MB.").show();
                    isValid = false;
                } else {
                    errorElement.hide();
                }
            } else {
                errorElement.hide();
            }
        } else {
            errorElement.hide();
            if (value) {
                if (field.minLength && value.length < field.minLength) {
                    errorElement.text(field.minLengthMessage).show();
                    isValid = false;
                } else if (field.customValidation && !$.validator.methods[field.customValidation].call(this, value, $(field.id)[0])) {
                    errorElement.text(field.customValidationMessage).show();
                    isValid = false;
                } else if (field.matchField && value !== $(field.matchField).val().trim()) {
                    errorElement.text(field.matchMessage).show();
                    isValid = false;
                }
            }
        }
    });
    return isValid;
}








function loadStudents() {
    $.ajax({
        url: apiBaseUrl + "Students",
        type: "GET",
        success: function (data) {
            var tableBody = $('#studentsTableBody');
            tableBody.empty();
            if (data.length > 0) {
                $.each(data, function (index, student) {
                    tableBody.append(
                        '<tr>' +
                        '<td>' + (student.studentId || '') + '</td>' +
                        '<td>' + (student.firstName || '') + '</td>' +
                        '<td>' + (student.lastName || '') + '</td>' +
                        '<td>' + (student.email || '') + '</td>' +
                        '<td>' + (student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '') + '</td>' +
                        '<td>' + (student.gender || '') + '</td>' +
                        '<td>' + (student.major || '') + '</td>' +
                        '<td>' + (student.createdDate ? new Date(student.createdDate).toLocaleDateString() : '') + '</td>' +
                        '<td>' +
                      
                        (student.imageUrl ? '<img src="' + imageBaseUrl + student.imageUrl + '" alt="Student Image" style="width: 50px; height: 50px;">' : 'No Image') +
                        '</td>' +
                        '<td>' +
                        '<button class="action-btn edit-btn" data-id="' + (student.studentId || '') + '">Update</button>' +
                        '<button class="action-btn delete-btn" data-id="' + (student.studentId || '') + '">Delete</button>' +
                        '</td>' +
                        '</tr>'
                    );
                });
            } else {
                tableBody.append('<tr><td colspan="10" class="no-data">No students found.</td></tr>');
            }
        },
        error: function (xhr) {
            var errorMsg = "Error loading students.";
            try {
                var response = JSON.parse(xhr.responseText);
                errorMsg = response.error || response.Error || errorMsg;
            } catch (e) { }
            $('#studentsTableBody').html('<tr><td colspan="10" class="no-data">' + errorMsg + '</td></tr>');
            console.log("AJAX error: ", xhr.responseText);
        }
    });
}

function openAddModal() {
    $('#addStudentForm')[0].reset();
    $('.error-message').hide();
    $('#alertContainer').hide();
    $('#addStudentModal').show();
}

function closeAddModal() {
    $('#addStudentModal').hide();
}

function addStudent() {
    var imageFile = $("#addImage")[0].files[0];

    var config = {
        fields: [
            { id: "#addFirstName", errorId: "#addFirstName-error", required: true, requiredMessage: "First name is required.", minLength: 1, maxLength: 50, minLengthMessage: "First name cannot be empty.", maxLengthMessage: "First name cannot exceed 50 characters." },
            { id: "#addLastName", errorId: "#addLastName-error", required: true, requiredMessage: "Last name is required.", minLength: 1, maxLength: 50, minLengthMessage: "Last name cannot be empty.", maxLengthMessage: "Last name cannot exceed 50 characters." },
            { id: "#addEmail", errorId: "#addEmail-error", required: true, requiredMessage: "Email is required.", customValidation: "customEmail", customValidationMessage: "Email must be a valid address (e.g., user@domain.com)." },
            { id: "#addDateOfBirth", errorId: "#addDateOfBirth-error", required: true, requiredMessage: "Date of birth is required.", customValidation: "validDate", customValidationMessage: "Date of birth must be a valid past date." },
            { id: "#addGender", errorId: "#addGender-error", required: true, requiredMessage: "Gender is required." },
            { id: "#addMajor", errorId: "#addMajor-error", maxLength: 50, maxLengthMessage: "Major cannot exceed 50 characters." },
            { id: "#addImage", errorId: "#addImage-error", required: false, requiredMessage: "Image is required.", file: true }
        ]
    };

    if (validateForm(config)) {
        var formData = new FormData();
        formData.append("FirstName", $("#addFirstName").val().trim());
        formData.append("LastName", $("#addLastName").val().trim());
        formData.append("Email", $("#addEmail").val().trim());
        formData.append("DateOfBirth", $("#addDateOfBirth").val());
        formData.append("Gender", $("#addGender").val());
        formData.append("Major", $("#addMajor").val().trim());
        if (imageFile) formData.append("Image", imageFile);

        $.ajax({
            url: apiBaseUrl + "Students",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            success: function (response) {
                $('#alertContainer').html('<div class="alert alert-success">' + (response.Message || "Student added successfully") + '</div>').show();
                setTimeout(function () {
                    $('#alertContainer').hide();
                    $('#addStudentModal').hide();
                    loadStudents();
                }, 2000);
            },
            error: function (xhr) {
                var errorMsg = "Error adding student.";
                try {
                    var response = JSON.parse(xhr.responseText);
                    if (response.Error) errorMsg = response.Error;
                    else if (response.Errors) errorMsg = Object.values(response.Errors).flat().join(", ");
                } catch (e) { }
                $('#alertContainer').html('<div class="alert alert-error">' + errorMsg + '</div>').show();
                console.log("AJAX error: ", xhr.responseText);
            }
        });
    }
}

function deleteStudent(studentId) {
    if (confirm("Are you sure you want to delete this student?")) {
        $.ajax({
            url: apiBaseUrl + "Students/" + studentId,
            type: "DELETE",
            success: function (response) {
                $('#alertContainer').html('<div class="alert alert-success">' + (response.Message || "Student deleted successfully") + '</div>').show();
                setTimeout(function () {
                    $('#alertContainer').hide();
                    loadStudents();
                }, 2000);
            },
            error: function (xhr) {
                var errorMsg = "Error deleting student.";
                try {
                    var response = JSON.parse(xhr.responseText);
                    errorMsg = response.error || response.Error || errorMsg;
                } catch (e) { }
                $('#alertContainer').html('<div class="alert alert-error">' + errorMsg + '</div>').show();
                console.log("AJAX error: ", xhr.responseText);
            }
        });
    }
}

function openEditModal(studentId) {
    $.ajax({
        url: apiBaseUrl + "Students/" + studentId,
        type: "GET",
        success: function (student) {
            $('#editStudentId').val(student.studentId);
            $('#editFirstName').val(student.firstName);
            $('#editLastName').val(student.lastName);
            $('#editEmail').val(student.email);
            $('#editDateOfBirth').val(student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '');
            $('#editGender').val(student.gender);
            $('#editMajor').val(student.major || '');
            $('.error-message').hide();
            $('#alertContainer').hide();
            $('#editStudentModal').show();
        },
        error: function (xhr) {
            var errorMsg = "Error loading student data.";
            try {
                var response = JSON.parse(xhr.responseText);
                errorMsg = response.error || response.Error || errorMsg;
            } catch (e) { }
            $('#alertContainer').html('<div class="alert alert-error">' + errorMsg + '</div>').show();
            console.log("AJAX error: ", xhr.responseText);
        }
    });
}

function closeEditModal() {
    $('#editStudentModal').hide();
}

function updateStudent() {
    var editImageElement = $("#editImage");
    var imageFile = editImageElement.length > 0 && editImageElement[0].files ? editImageElement[0].files[0] : null;

    var config = {
        fields: [
            { id: "#editFirstName", errorId: "#editFirstName-error", required: true, requiredMessage: "First name is required.", minLength: 1, maxLength: 50, minLengthMessage: "First name cannot be empty.", maxLengthMessage: "First name cannot exceed 50 characters." },
            { id: "#editLastName", errorId: "#editLastName-error", required: true, requiredMessage: "Last name is required.", minLength: 1, maxLength: 50, minLengthMessage: "Last name cannot be empty.", maxLengthMessage: "Last name cannot exceed 50 characters." },
            { id: "#editEmail", errorId: "#editEmail-error", required: true, requiredMessage: "Email is required.", customValidation: "customEmail", customValidationMessage: "Email must be a valid address (e.g., user@domain.com)." },
            { id: "#editDateOfBirth", errorId: "#editDateOfBirth-error", required: true, requiredMessage: "Date of birth is required.", customValidation: "validDate", customValidationMessage: "Date of birth must be a valid past date." },
            { id: "#editGender", errorId: "#editGender-error", required: true, requiredMessage: "Gender is required." },
            { id: "#editMajor", errorId: "#editMajor-error", maxLength: 50, maxLengthMessage: "Major cannot exceed 50 characters." }
        ]
    };

    if (imageFile) {
        config.fields.push({
            id: "#editImage",
            errorId: "#editImage-error",
            required: false,
            file: true
        });
    }

    if (validateForm(config)) {
        var formData = new FormData();
        formData.append("StudentId", $('#editStudentId').val());
        formData.append("FirstName", $("#editFirstName").val().trim());
        formData.append("LastName", $("#editLastName").val().trim());
        formData.append("Email", $("#editEmail").val().trim());
        formData.append("DateOfBirth", $("#editDateOfBirth").val());
        formData.append("Gender", $("#editGender").val());
        formData.append("Major", $("#editMajor").val().trim());
        if (imageFile) formData.append("Image", imageFile);

        $.ajax({
            url: apiBaseUrl + "Students/" + $('#editStudentId').val(),
            type: "PUT",
            data: formData,
            contentType: false,
            processData: false,
            success: function (response) {
                $('#alertContainer').html('<div class="alert alert-success">' + (response.Message || "Student updated successfully") + '</div>').show();
                setTimeout(function () {
                    $('#alertContainer').hide();
                    $('#editStudentModal').hide();
                    loadStudents();
                }, 2000);
            },
            error: function (xhr) {
                var errorMsg = "Error updating student.";
                try {
                    var response = JSON.parse(xhr.responseText);
                    if (response.Error) errorMsg = response.Error;
                    else if (response.Errors) errorMsg = Object.values(response.Errors).flat().join(", ");
                } catch (e) { }
                $('#alertContainer').html('<div class="alert alert-error">' + errorMsg + '</div>').show();
                console.log("AJAX error: ", xhr.responseText);
            }
        });
    }
}


$(document).ready(function () {

    loadStudents();

    $(".add-btn").on("click", openAddModal);

    $("#addStudentForm").on("submit", function (e) {
        e.preventDefault();
        addStudent();
    });

    $(".btn-secondary").on("click", function (e) {
        e.preventDefault();
        var modalId = $(this).closest('.modal-overlay').attr('id');
        $('#' + modalId).hide();
    });

    $(document).on("click", ".delete-btn", function () {
        var studentId = $(this).data("id");
        deleteStudent(studentId);
    });

    $(document).on("click", ".edit-btn", function () {
        var studentId = $(this).data("id");
        openEditModal(studentId);
    });

    $("#editStudentForm").on("submit", function (e) {
        e.preventDefault();
        updateStudent();
    });

    $("#loginButton").on("click", function () {
        var email = $("#email").val().trim();
        var password = $("#password").val().trim();
        var config = {
            fields: [
                {
                    id: "#email",
                    errorId: "#email-error",
                    required: true,
                    requiredMessage: "Email is required.",
                    customValidation: "customEmail",
                    customValidationMessage: "Email must be a valid address (e.g., user@domain.com)."
                },
                {
                    id: "#password",
                    errorId: "#password-error",
                    required: true,
                    requiredMessage: "Password is required.",
                    minLength: 6,
                    minLengthMessage: "Password must be at least 6 characters."
                }
            ]
        };

        if (validateForm(config)) {
            console.log("Form is valid, submitting...");
            var data = {
                Email: email,
                Password: password
            };

            $.ajax({
                url: loginUrl,
                type: "POST",
                data: JSON.stringify(data),
                contentType: "application/json",
                success: function (response) {
                    $("#login-message").text(response.Message)
                        .css("color", response.Success ? "green" : "red")
                        .show();
                    if (response.Success) {
                        setTimeout(function () {
                            window.location.href = dashboardUrl;
                        }, 1000);
                    }
                },
                error: function (xhr) {
                    var errorMsg = "Login failed due to an unexpected error.";
                    try {
                        var response = JSON.parse(xhr.responseText);
                        if (response && !response.Success && response.Message) {
                            errorMsg = response.Message;
                        }
                        $("#login-message").text(errorMsg)
                            .css("color", "red")
                            .show();
                        $("#email-error").hide();
                        $("#password-error").hide();
                    } catch (e) {
                        $("#login-message").text(errorMsg)
                            .css("color", "red")
                            .show();
                    }
                    console.log("AJAX error: ", xhr.responseText);
                }
            });
        }
    });

    $("#registerButton").on("click", function () {
        var name = $("#name").val().trim();
        var email = $("#email").val().trim();
        var password = $("#password").val().trim();
        var confirmPassword = $("#confirm-password").val().trim();
        var gender = $("#gender").val();
        var dateOfBirth = $("#date-of-birth").val();
        var imageFile = $("#image")[0].files[0];
        var config = {
            fields: [
                {
                    id: "#name",
                    errorId: "#name-error",
                    required: true,
                    requiredMessage: "Name is required.",
                    minLength: 1,
                    maxLength: 50,
                    minLengthMessage: "Name cannot be empty.",
                    maxLengthMessage: "Name cannot exceed 50 characters."
                },
                {
                    id: "#email",
                    errorId: "#email-error",
                    required: true,
                    requiredMessage: "Email is required.",
                    customValidation: "customEmail",
                    customValidationMessage: "Email must be a valid address (e.g., user@domain.com)."
                },
                {
                    id: "#password",
                    errorId: "#password-error",
                    required: true,
                    requiredMessage: "Password is required.",
                    minLength: 6,
                    minLengthMessage: "Password must be at least 6 characters."
                },
                {
                    id: "#confirm-password",
                    errorId: "#confirm-password-error",
                    required: true,
                    requiredMessage: "Confirm Password is required.",
                    matchField: "#password",
                    matchMessage: "Confirm Password must match the password."
                },
                {
                    id: "#gender",
                    errorId: "#gender-error",
                    required: true,
                    requiredMessage: "Gender is required."
                },
                {
                    id: "#date-of-birth",
                    errorId: "#date-of-birth-error",
                    required: true,
                    requiredMessage: "Date of Birth is required.",
                    customValidation: "validDate",
                    customValidationMessage: "Date of Birth must be a valid past date."
                },
                {
                    id: "#image",
                    errorId: "#image-error",
                    required: false, // Changed to optional
                    requiredMessage: "Image is required.",
                    file: true
                }
            ]
        };

        if (validateForm(config)) {
            console.log("Form is valid, submitting...");
            var formData = new FormData();
            formData.append("Name", name);
            formData.append("Email", email);
            formData.append("Password", password);
            formData.append("ConfirmPassword", confirmPassword);
            formData.append("Gender", gender);
            formData.append("DateOfBirth", dateOfBirth);
            if (imageFile) formData.append("Image", imageFile);

            $.ajax({
                url: registerUrl,
                type: "POST",
                data: formData,
                contentType: false,
                processData: false,
                success: function (response) {
                    $("#register-message").text(response.Message)
                        .css("color", response.Success ? "green" : "red")
                        .show();
                    if (response.Success) {
                        setTimeout(function () {
                            window.location.href = dashboardUrl;
                        }, 1000);
                    }
                },
                error: function (xhr) {
                    var errorMsg = "Registration failed due to an unexpected error.";
                    try {
                        var response = JSON.parse(xhr.responseText);
                        if (response && !response.Success && response.Message) {
                            errorMsg = response.Message;
                        }
                        $("#register-message").text(errorMsg)
                            .css("color", "red")
                            .show();
                        $("#name-error").hide();
                        $("#email-error").hide();
                        $("#password-error").hide();
                        $("#confirm-password-error").hide();
                        $("#gender-error").hide();
                        $("#date-of-birth-error").hide();
                        $("#image-error").hide();
                    } catch (e) {
                        $("#register-message").text(errorMsg)
                            .css("color", "red")
                            .show();
                    }
                    console.log("AJAX error: ", xhr.responseText);
                }
            });
        }
    });
});