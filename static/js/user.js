document.addEventListener("DOMContentLoaded", function() {

    const dropbtn = document.querySelector(".dropbtn");
    const dropdownContent = document.querySelector(".dropdown-content");

    dropbtn.addEventListener("click", function(event) {
        event.stopPropagation();  // Prevents the click from closing immediately
        dropdownContent.classList.toggle("show");
    });

    // Close the dropdown when clicking outside of it
    document.addEventListener("click", function(event) {
        if (!dropbtn.contains(event.target) && !dropdownContent.contains(event.target)) {
            dropdownContent.classList.remove("show");
        }
    });

});
