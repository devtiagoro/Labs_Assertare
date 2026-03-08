console.log("Sistema Assertare carregado")

const AUTH_STORAGE_KEY = "assertare.auth"
const API_BASE_URL = "/api"

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar")
    const main = document.getElementById("main")

    sidebar?.classList.toggle("active")
    main?.classList.toggle("shift")
}

function getSession() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "{}")
    } catch (error) {
        return {}
    }
}

function redirectToLogin() {
    window.location.href = "/auth/login.html"
}

function redirectIfNoPermission(user) {
    const isAdminPage = window.location.pathname.includes("/system/Administrativo/empresas/")

    if (isAdminPage && user.role !== "Administrador") {
        alert("Você não possui permissão para acessar a tela de empresas.")
        window.location.href = "/system/Dashboard/dashboard.html"
        return true
    }

    return false
}

async function ensureAuthenticatedAccess() {
    const session = getSession()

    if (!session?.token) {
        redirectToLogin()
        return
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${session.token}`
            }
        })

        const data = await response.json()

        if (!response.ok || !data?.user?.email || !data?.user?.role) {
            throw new Error("Sessão inválida")
        }

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
            ...session,
            ...data.user
        }))

        if (redirectIfNoPermission(data.user)) {
            return
        }

        const nameEl = document.querySelector(".user-name")
        const roleEl = document.querySelector(".user-role")

        if (nameEl) {
            nameEl.textContent = data.user.name || data.user.email
        }

        if (roleEl) {
            roleEl.textContent = data.user.role
        }
    } catch (error) {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        redirectToLogin()
    }
}

document.addEventListener("DOMContentLoaded", ensureAuthenticatedAccess)