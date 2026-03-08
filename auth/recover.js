(() => {
    const recoverForm = document.getElementById("recoverForm")
    const recoverEmail = document.getElementById("recoverEmail")
    const recoverButton = document.getElementById("recoverButton")
    const recoverMessage = document.getElementById("recoverMessage")
    const themeToggle = document.getElementById("themeToggle")
    const themeIcon = themeToggle?.querySelector(".theme-icon")

    const API_BASE_URL = "/api"

    const setMessage = (text, type = "") => {
        if (!recoverMessage) return

        recoverMessage.textContent = text
        recoverMessage.classList.remove("is-success", "is-error")

        if (type) {
            recoverMessage.classList.add(type)
        }
    }

    const syncThemeIcon = () => {
        if (!themeIcon) return
        themeIcon.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙"
    }

    const normalizeEmail = (value) => value.trim().toLowerCase()

    syncThemeIcon()

    themeToggle?.addEventListener("click", () => {
        requestAnimationFrame(syncThemeIcon)
    })

    recoverForm?.addEventListener("submit", async (e) => {
        e.preventDefault()

        if (!recoverEmail || !recoverButton) return

        const typedEmail = normalizeEmail(recoverEmail.value)

        try {
            recoverButton.disabled = true
            recoverButton.textContent = "Enviando..."

            const response = await fetch(`${API_BASE_URL}/auth/recover`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: typedEmail
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Não foi possível validar o e-mail informado.")
            }

            localStorage.setItem("assertare.recovery.email", typedEmail)
            setMessage(data.message || "Orientações enviadas para o e-mail informado.", "is-success")

            recoverButton.textContent = "Enviado"

            setTimeout(() => {
                window.location.href = "verify.html"
            }, 900)
        } catch (error) {
            setMessage(error.message, "is-error")
            recoverButton.disabled = false
            recoverButton.textContent = "Enviar orientações"
        }
    })
})()