(() => {
    const password = document.getElementById("password")
    const email = document.getElementById("email")
    const togglePassword = document.getElementById("togglePassword")
    const loginForm = document.getElementById("loginForm")
    const loginButton = document.getElementById("loginButton")
    const authMessage = document.getElementById("authMessage")
    const themeToggle = document.getElementById("themeToggle")
    const themeIcon = themeToggle?.querySelector(".theme-icon")

    const API_BASE_URL = "/api"

    const setMessage = (text, type = "") => {
        if (!authMessage) return

        authMessage.textContent = text
        authMessage.classList.remove("is-success", "is-error")

        if (type) {
            authMessage.classList.add(type)
        }
    }

    const syncThemeIcon = () => {
        if (!themeIcon) return
        themeIcon.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙"
    }

    const normalizeEmail = (value) => value.trim().toLowerCase()

    const parseApiResponse = async (response) => {
        const rawText = await response.text()

        if (!rawText) {
            return {}
        }

        try {
            return JSON.parse(rawText)
        } catch (error) {
            throw new Error("Servidor retornou resposta inválida. Tente novamente em instantes.")
        }
    }

    syncThemeIcon()

    themeToggle?.addEventListener("click", () => {
        requestAnimationFrame(syncThemeIcon)
    })

    togglePassword?.addEventListener("click", () => {
        const isPassword = password?.type === "password"

        if (password) {
            password.type = isPassword ? "text" : "password"
        }

        togglePassword.textContent = isPassword ? "👀" : "👁️"
        togglePassword.setAttribute("aria-label", isPassword ? "Ocultar senha" : "Mostrar senha")
    })

    loginForm?.addEventListener("submit", async (e) => {
        e.preventDefault()

        if (!loginButton || !email || !password) return

        const typedEmail = normalizeEmail(email.value)
        const typedPassword = password.value

        try {
            loginButton.textContent = "Entrando..."
            loginButton.disabled = true
            setMessage("Validando credenciais...", "")

            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: typedEmail,
                    password: typedPassword
                })
            })

            const data = await parseApiResponse(response)

            if (!response.ok) {
                throw new Error(data.error || "Acesso negado. Verifique e-mail e senha autorizados.")
            }

            if (!data?.token || !data?.user) {
                throw new Error("Não foi possível concluir o login. Resposta incompleta do servidor.")
            }

            const sessionUser = {
                token: data.token,
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role,
                loggedAt: Date.now(),
            }

            localStorage.setItem("assertare.auth", JSON.stringify(sessionUser))

            setMessage("Acesso autorizado. Redirecionando...", "is-success")

            setTimeout(() => {
                window.location.href = "../system/Dashboard/dashboard.html"
            }, 700)
        } catch (error) {
            const fallback = "Não foi possível conectar com o servidor de autenticação. Verifique se a API está ativa."
            setMessage(error.message || fallback, "is-error")
            loginButton.disabled = false
            loginButton.textContent = "Entrar"
        }
    })
})()