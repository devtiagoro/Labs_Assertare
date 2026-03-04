
// alternar tema

const toggle = document.getElementById("themeToggle")

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark")
}

toggle.addEventListener("click", () => {

    document.body.classList.toggle("dark")

    if (document.body.classList.contains("dark")) {

        localStorage.setItem("theme", "dark")

    } else {

        localStorage.setItem("theme", "light")

    }

})


// mostrar senha

const password = document.getElementById("password")
const togglePassword = document.getElementById("togglePassword")

togglePassword.addEventListener("click", () => {

    if (password.type === "password") {

        password.type = "text"

    } else {

        password.type = "password"

    }

})


// feedback botão login

const loginForm = document.getElementById("loginForm")
const loginButton = document.getElementById("loginButton")

loginForm.addEventListener("submit", function (e) {

    e.preventDefault()

    loginButton.textContent = "Entrando..."

    setTimeout(() => {

        window.location.href = "dashboard.html"

    }, 800)

})