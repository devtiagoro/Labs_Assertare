const http = require("http")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

const PORT = process.env.PORT || 4173
const ROOT = __dirname
const DB_FILE = path.join(ROOT, "data", "db.json")
const sessions = new Map()

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
}

function readDb() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"))
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ""

    req.on("data", (chunk) => {
      raw += chunk
      if (raw.length > 1_000_000) {
        reject(new Error("Payload muito grande"))
      }
    })

    req.on("end", () => {
      if (!raw) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error("JSON inválido"))
      }
    })

    req.on("error", reject)
  })
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  })
  res.end(JSON.stringify(payload))
}

function getToken(req) {
  const auth = req.headers.authorization || ""
  if (!auth.startsWith("Bearer ")) return null
  return auth.slice(7)
}

function getSessionUser(req) {
  const token = getToken(req)
  if (!token) return null

  const session = sessions.get(token)
  if (!session) return null

  const db = readDb()
  const user = db.users.find((item) => item.id === session.userId && item.active)
  if (!user) return null

  return { token, user }
}

function requireAuth(req, res) {
  const sessionUser = getSessionUser(req)
  if (!sessionUser) {
    sendJson(res, 401, { error: "Não autenticado." })
    return null
  }

  return sessionUser
}

function requireAdmin(req, res) {
  const sessionUser = requireAuth(req, res)
  if (!sessionUser) return null

  if (sessionUser.user.role !== "Administrador") {
    sendJson(res, 403, { error: "Acesso permitido apenas para administrador." })
    return null
  }

  return sessionUser
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  }
}

function normalizeCompany(payload = {}) {
  return {
    nome: payload.nome || "",
    cnpj: payload.cnpj || "",
    responsavel: payload.responsavel || "",
    email: payload.email || "",
    telefone: payload.telefone || "",
    status: payload.status || "ativa",
    fechamento: payload.fechamento || "-",
    contasBancarias: Array.isArray(payload.contasBancarias) ? payload.contasBancarias : [],
    pessoas: Array.isArray(payload.pessoas) ? payload.pessoas : [],
    planosContas: payload.planosContas || { dre: [], fluxoCaixa: [] }
  }
}

function randomPassword() {
  return `Cli@${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 90 + 10)}`
}

async function handleApi(req, res, pathname) {
  if (req.method === "POST" && pathname === "/api/auth/login") {
    const body = await getJsonBody(req)
    const email = String(body.email || "").trim().toLowerCase()
    const password = String(body.password || "")

    const db = readDb()
    const user = db.users.find((item) => item.email.toLowerCase() === email && item.password === password && item.active)

    if (!user) {
      sendJson(res, 401, { error: "Credenciais inválidas." })
      return
    }

    const token = crypto.randomBytes(24).toString("hex")
    sessions.set(token, { userId: user.id, createdAt: Date.now() })

    sendJson(res, 200, { token, user: publicUser(user) })
    return
  }

  if (req.method === "POST" && pathname === "/api/auth/recover") {
    const body = await getJsonBody(req)
    const email = String(body.email || "").trim().toLowerCase()
    const db = readDb()
    const user = db.users.find((item) => item.email.toLowerCase() === email && item.active)

    if (!user) {
      sendJson(res, 404, { error: "E-mail não localizado na base de acesso." })
      return
    }

    sendJson(res, 200, { message: "Orientações enviadas para o e-mail informado." })
    return
  }

  if (req.method === "GET" && pathname === "/api/auth/me") {
    const sessionUser = requireAuth(req, res)
    if (!sessionUser) return
    sendJson(res, 200, { user: publicUser(sessionUser.user) })
    return
  }

  if (req.method === "GET" && pathname === "/api/companies") {
    const sessionUser = requireAuth(req, res)
    if (!sessionUser) return

    const db = readDb()
    sendJson(res, 200, { companies: db.companies })
    return
  }

  if (req.method === "POST" && pathname === "/api/companies") {
    const sessionUser = requireAdmin(req, res)
    if (!sessionUser) return

    const body = await getJsonBody(req)
    const db = readDb()
    const payload = normalizeCompany(body)

    const nextId = db.companies.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
    const company = { id: nextId, ...payload }
    db.companies.unshift(company)

    let createdUser = null

    if (body.createClientUser && company.email) {
      const exists = db.users.some((user) => user.email.toLowerCase() === company.email.toLowerCase())

      if (!exists) {
        const tempPassword = randomPassword()
        const nextUserId = db.users.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1

        const user = {
          id: nextUserId,
          name: company.responsavel || company.nome,
          email: company.email,
          password: tempPassword,
          role: "Cliente",
          active: true
        }

        db.users.push(user)

        createdUser = {
          email: user.email,
          password: user.password,
          role: user.role
        }
      }
    }

    writeDb(db)
    sendJson(res, 201, { company, createdUser })
    return
  }

  if (req.method === "PUT" && /^\/api\/companies\/\d+$/.test(pathname)) {
    const sessionUser = requireAdmin(req, res)
    if (!sessionUser) return

    const companyId = Number(pathname.split("/").pop())
    const body = await getJsonBody(req)
    const db = readDb()
    const index = db.companies.findIndex((item) => Number(item.id) === companyId)

    if (index < 0) {
      sendJson(res, 404, { error: "Empresa não encontrada." })
      return
    }

    const current = db.companies[index]
    const updated = { ...current, ...normalizeCompany(body), id: current.id }
    db.companies[index] = updated
    writeDb(db)
    sendJson(res, 200, { company: updated })
    return
  }

  if (req.method === "POST" && pathname === "/api/users") {
    const sessionUser = requireAdmin(req, res)
    if (!sessionUser) return

    const body = await getJsonBody(req)
    const email = String(body.email || "").trim().toLowerCase()

    if (!email) {
      sendJson(res, 400, { error: "Email é obrigatório." })
      return
    }

    const db = readDb()
    const exists = db.users.some((user) => user.email.toLowerCase() === email)
    if (exists) {
      sendJson(res, 409, { error: "Já existe usuário com esse email." })
      return
    }

    const nextUserId = db.users.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
    const password = String(body.password || randomPassword())
    const user = {
      id: nextUserId,
      name: String(body.name || "Novo Usuário"),
      email,
      password,
      role: String(body.role || "Cliente"),
      active: true
    }

    db.users.push(user)
    writeDb(db)
    sendJson(res, 201, { user: publicUser(user), temporaryPassword: password })
    return
  }

  sendJson(res, 404, { error: "Rota de API não encontrada." })
}

function serveStatic(req, res, pathname) {
  let filePath = pathname === "/" ? "/auth/login.html" : pathname
  filePath = path.normalize(path.join(ROOT, filePath))

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403)
    res.end("Forbidden")
    return
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      res.writeHead(404)
      res.end("Not Found")
      return
    }

    const ext = path.extname(filePath).toLowerCase()
    const mime = MIME_TYPES[ext] || "application/octet-stream"

    res.writeHead(200, { "Content-Type": mime })
    fs.createReadStream(filePath).pipe(res)
  })
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url.pathname)
      return
    }

    serveStatic(req, res, url.pathname)
  } catch (error) {
    sendJson(res, 500, { error: "Erro interno no servidor.", details: error.message })
  }
})

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor Assertare ativo em http://0.0.0.0:${PORT}`)
})