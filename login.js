function login() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;

    if (user === "admin" && pass === "1234") {
        alert("Login Successful 🎉");
        window.location.href = "dashboard.html"; // redirect
    } else {
        alert("Invalid Credentials ❌");
    }
}