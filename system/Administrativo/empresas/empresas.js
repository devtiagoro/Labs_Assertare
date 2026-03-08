function createDefaultPlanos() {
  return {
    dre: [],
    fluxoCaixa: []
  };
}

let companies = [];


let nextPlanNodeId = 1;
let createCollections = { contasBancarias: [], pessoas: [], planosContas: createDefaultPlanos() };
let editCollections = { contasBancarias: [], pessoas: [], planosContas: createDefaultPlanos() };

const tableBody = document.getElementById("companiesTableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchCompany");
const statusFilter = document.getElementById("statusFilter");

const modal = document.getElementById("companyModal");
const openModalButton = document.getElementById("openCompanyModal");
const closeModalButton = document.getElementById("closeCompanyModal");
const form = document.getElementById("companyForm");
const tabButtons = Array.from(document.querySelectorAll("[data-tab]"));
const tabPanels = Array.from(document.querySelectorAll("[data-panel]"));
const previousTabButton = document.getElementById("previousTab");
const nextTabButton = document.getElementById("nextTab");

const companyViewModal = document.getElementById("companyViewModal");
const companyViewForm = document.getElementById("companyViewForm");
const viewCompanyIdInput = document.getElementById("viewCompanyId");
const viewTabButtons = Array.from(document.querySelectorAll("[data-view-tab]"));
const viewTabPanels = Array.from(document.querySelectorAll("[data-view-panel]"));
const closeViewModal = document.getElementById("closeViewModal");
const closeViewModalBottom = document.getElementById("closeViewModalBottom");

let activeTabIndex = 0;


const EMPRESAS_API_BASE_URL = "/api";

function getSession() {
  try {
    return JSON.parse(localStorage.getItem("assertare.auth") || "{}");
  } catch (error) {
    return {};
  }
}

function getAuthHeaders() {
  const session = getSession();
  const headers = { "Content-Type": "application/json" };

  if (session.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  return headers;
}

function ensureAdminAccess() {
  const session = getSession();

  if (session.role !== "Administrador") {
    alert("Acesso restrito: somente administradores podem acessar Empresas.");
    window.location.href = "/system/Dashboard/dashboard.html";
    return false;
  }

  return true;
}

async function fetchCompanies() {
  const response = await fetch(`${EMPRESAS_API_BASE_URL}/companies`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar empresas.");
  }

  return response.json();
}

async function createCompany(payload) {
  const response = await fetch(`${EMPRESAS_API_BASE_URL}/companies`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Falha ao cadastrar empresa.");
  }

  return data;
}

async function updateCompany(companyId, payload) {
  const response = await fetch(`${EMPRESAS_API_BASE_URL}/companies/${companyId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Falha ao atualizar empresa.");
  }

  return data;
}


function clonePlanos(planos) {
  return JSON.parse(JSON.stringify(planos || createDefaultPlanos()));
}

function formatStatus(status) {
  if (status === "ativa") return "Ativa";
  if (status === "implantacao") return "Implantação";
  return "Inativa";
}

function setActiveTab(index) {
  activeTabIndex = index;
  tabButtons.forEach((button, idx) => button.classList.toggle("active", idx === index));
  tabPanels.forEach((panel, idx) => panel.classList.toggle("active", idx === index));
  previousTabButton.disabled = index === 0;
  nextTabButton.disabled = index === tabButtons.length - 1;
}

function setViewTab(index) {
  viewTabButtons.forEach((button, idx) => button.classList.toggle("active", idx === index));
  viewTabPanels.forEach((panel, idx) => panel.classList.toggle("active", idx === index));
}

function listItemTemplate(text, index, type, mode) {
  return `<div class="entry-item"><span>${text}</span><button type="button" class="entry-remove" data-mode="${mode}" data-type="${type}" data-index="${index}">Remover</button></div>`;

    tableBody.innerHTML = "";

  if (!filtered.length) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  filtered.forEach((company) => {
    const pessoaPrincipal = company.pessoas[0] ? `${company.pessoas[0].nome} (${company.pessoas[0].documento})` : "Sem pessoa";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${company.nome}</td>
      <td>${company.cnpj}</td>
      <td>${pessoaPrincipal}</td>
      <td><span class="badge ${company.status}">${formatStatus(company.status)}</span></td>
      <td>${company.fechamento}</td>
      <td class="cell-actions"><button type="button" class="btn secondary edit-button" data-company-id="${company.id}">Editar</button></td>
    `;

    tableBody.appendChild(row);
  });
}


function getPlanActionType(actionButton) {
  if (actionButton.classList.contains("plan-add")) return "add";
  if (actionButton.classList.contains("plan-edit")) return "edit";
  return "delete";
}

function removeFromCollection(mode, type, index) {
  const collection = mode === "create" ? createCollections : editCollections;
  collection[type].splice(index, 1);
  if (mode === "create") renderCreateCollections();
  if (mode === "edit") renderEditCollections();
}

openModalButton.addEventListener("click", openCreateModal);
closeModalButton.addEventListener("click", closeCreateModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeCreateModal();
});

closeViewModal.addEventListener("click", closeDetailsModal);
closeViewModalBottom.addEventListener("click", closeDetailsModal);
companyViewModal.addEventListener("click", (event) => {
  if (event.target === companyViewModal) closeDetailsModal();
});

document.getElementById("addCreateBank").addEventListener("click", addCreateBank);
document.getElementById("addCreatePerson").addEventListener("click", addCreatePerson);
document.getElementById("addEditBank").addEventListener("click", addEditBank);
document.getElementById("addEditPerson").addEventListener("click", addEditPerson);
document.getElementById("addCreatePlan").addEventListener("click", () => addPlan("create"));
document.getElementById("addEditPlan").addEventListener("click", () => addPlan("edit"));

["create", "edit"].forEach((mode) => {
  document.getElementById(`${mode}PlanGroup`).addEventListener("change", () => refreshParentOptions(mode));
  document.getElementById(`${mode}PlanLevel`).addEventListener("change", () => refreshParentOptions(mode));
  document.getElementById(`${mode}PlanParent`).addEventListener("change", () => refreshParentOptions(mode));
});

modal.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".entry-remove");
  if (removeButton) {
    removeFromCollection(removeButton.dataset.mode, removeButton.dataset.type, Number(removeButton.dataset.index));
    return;
  }

  const actionButton = event.target.closest(".plan-add, .plan-edit, .plan-delete");
  if (actionButton) {
    handlePlanAction(
      actionButton.dataset.mode,
      getPlanActionType(actionButton),
      actionButton.dataset.structure,
      Number(actionButton.dataset.nodeId)
    );
  }
});

companyViewModal.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".entry-remove");
  if (removeButton) {
    removeFromCollection("edit", removeButton.dataset.type, Number(removeButton.dataset.index));
    return;
  }

  const actionButton = event.target.closest(".plan-add, .plan-edit, .plan-delete");
  if (actionButton) {
    handlePlanAction(
      "edit",
      getPlanActionType(actionButton),
      actionButton.dataset.structure,
      Number(actionButton.dataset.nodeId)
    );
  }
});

tableBody.addEventListener("click", (event) => {
  const target = event.target.closest(".edit-button");
  if (!target) return;
  openViewModal(Number(target.dataset.companyId));
});

tabButtons.forEach((button, idx) => button.addEventListener("click", () => setActiveTab(idx)));
viewTabButtons.forEach((button, idx) => button.addEventListener("click", () => setViewTab(idx)));

previousTabButton.addEventListener("click", () => {
  if (activeTabIndex > 0) setActiveTab(activeTabIndex - 1);
});

nextTabButton.addEventListener("click", () => {
  if (activeTabIndex < tabButtons.length - 1) setActiveTab(activeTabIndex + 1);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);

  if (!createCollections.pessoas.length) {
    alert("Adicione ao menos uma pessoa vinculada para salvar a empresa.");
    return;
  }

  try {
    const payload = {
      nome: formData.get("nome"),
      cnpj: formData.get("cnpj"),
      responsavel: formData.get("responsavel"),
      email: formData.get("email"),
      telefone: formData.get("telefone"),
      status: formData.get("status"),
      fechamento: "-",
      contasBancarias: createCollections.contasBancarias.map((item) => ({ ...item })),
      pessoas: createCollections.pessoas.map((item) => ({ ...item })),
      planosContas: clonePlanos(createCollections.planosContas),
      createClientUser: true
    };

    const result = await createCompany(payload);

    companies.unshift(result.company);
    closeCreateModal();
    renderCompanies();

    if (result.createdUser) {
      alert(`Usuário do cliente criado com sucesso.\nEmail: ${result.createdUser.email}\nSenha temporária: ${result.createdUser.password}`);
    }
  } catch (error) {
    alert(error.message);
  }
});

companyViewForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const companyId = Number(viewCompanyIdInput.value);
  const company = companies.find((item) => item.id === companyId);

  if (!company) return;

  try {
    const payload = {
      nome: companyViewForm.elements.nome.value,
      cnpj: companyViewForm.elements.cnpj.value,
      responsavel: companyViewForm.elements.responsavel.value,
      email: companyViewForm.elements.email.value,
      telefone: companyViewForm.elements.telefone.value,
      status: companyViewForm.elements.status.value,
      fechamento: company.fechamento || "-",
      contasBancarias: editCollections.contasBancarias.map((item) => ({ ...item })),
      pessoas: editCollections.pessoas.map((item) => ({ ...item })),
      planosContas: clonePlanos(editCollections.planosContas)
    };

    const result = await updateCompany(companyId, payload);
    const index = companies.findIndex((item) => item.id === companyId);

    if (index >= 0) {
      companies[index] = result.company;
    }

    renderCompanies();
    closeDetailsModal();
  } catch (error) {
    alert(error.message);
  }
});

searchInput.addEventListener("input", renderCompanies);
statusFilter.addEventListener("change", renderCompanies);

async function bootstrap() {
  if (!ensureAdminAccess()) return;

  try {
    const data = await fetchCompanies();
    companies = data.companies || [];

    renderCreateCollections();
    setActiveTab(0);
    renderCompanies();
  } catch (error) {
    alert(error.message);
  }
}

bootstrap();