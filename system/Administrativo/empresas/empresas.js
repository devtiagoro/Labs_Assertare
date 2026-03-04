function createDefaultPlanos() {
  return {
    dre: [],
    fluxoCaixa: []
  };
}

const companies = [
  {
    id: 1,
    nome: "Mecânica Aurora Ltda",
    cnpj: "12.345.678/0001-90",
    responsavel: "Carlos Pereira",
    email: "carlos@aurora.com",
    telefone: "(11) 98888-1111",
    status: "ativa",
    fechamento: "05/03/2026",
    contasBancarias: [{ banco: "Itaú", agencia: "1234", conta: "8899-0", tipoConta: "Conta corrente" }],
    pessoas: [{ nome: "Ana Paula Costa", documento: "123.456.789-00", planoConta: "Clientes" }],
    planosContas: createDefaultPlanos()
  }
];

let nextCompanyId = 2;
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
}

function renderCollection(listElementId, collection, type, mode) {
  const list = document.getElementById(listElementId);
  if (!collection.length) {
    list.innerHTML = '<p class="entry-empty">Nenhum item adicionado.</p>';
    return;
  }

  list.innerHTML = collection
    .map((item, idx) => {
      if (type === "contasBancarias") return listItemTemplate(`${item.banco} | Ag.: ${item.agencia} | Conta: ${item.conta} (${item.tipoConta})`, idx, type, mode);
      return listItemTemplate(`${item.nome} (${item.documento}) | Plano: ${item.planoConta}`, idx, type, mode);
    })
    .join("");
}

function nodeTemplate(node, structure, level, mode) {
  const nested = level === "pai" ? (node.netos || []).map((grand) => nodeTemplate(grand, structure, "neto", mode)).join("") : "";

  return `
    <div class="plan-node">
      <div class="plan-line">
        <strong>${node.nome}</strong>
        <div class="plan-actions">
          <button type="button" class="plan-edit" data-mode="${mode}" data-structure="${structure}" data-level="${level}" data-node-id="${node.id}">Editar</button>
          <button type="button" class="plan-delete" data-mode="${mode}" data-structure="${structure}" data-level="${level}" data-node-id="${node.id}">Excluir</button>
        </div>
      </div>
      ${nested}
    </div>
  `;
}

function renderPlanTree(targetId, planos, mode) {
  const target = document.getElementById(targetId);
  const structures = [
    { key: "dre", label: "DRE" },
    { key: "fluxoCaixa", label: "Fluxo de Caixa" }
  ];

  target.innerHTML = structures
    .map((structure) => {
      const nodes = planos[structure.key] || [];
      const content = nodes.length
        ? nodes.map((node) => nodeTemplate(node, structure.key, "pai", mode)).join("")
        : '<p class="entry-empty">Sem planos adicionados.</p>';

      return `<div class="plan-structure-box"><h4>${structure.label}</h4>${content}</div>`;
    })
    .join("");
}

function renderCreateCollections() {
  renderCollection("createBankList", createCollections.contasBancarias, "contasBancarias", "create");
  renderCollection("createPeopleList", createCollections.pessoas, "pessoas", "create");
  renderPlanTree("createPlanTree", createCollections.planosContas, "create");
  refreshParentOptions("create");
}

function renderEditCollections() {
  renderCollection("editBankList", editCollections.contasBancarias, "contasBancarias", "edit");
  renderCollection("editPeopleList", editCollections.pessoas, "pessoas", "edit");
  renderPlanTree("editPlanTree", editCollections.planosContas, "edit");
  refreshParentOptions("edit");
}

function refreshParentOptions(mode) {
  const groupSelect = document.getElementById(`${mode}PlanGroup`);
  const levelSelect = document.getElementById(`${mode}PlanLevel`);
  const parentSelect = document.getElementById(`${mode}PlanParent`);
  const parentWrap = document.getElementById(`${mode}PlanParentWrap`);

  if (!groupSelect || !levelSelect || !parentSelect || !parentWrap) return;

  const collections = mode === "create" ? createCollections : editCollections;
  const structure = collections.planosContas[groupSelect.value] || [];
  const level = levelSelect.value;

  if (level === "filho") {
    parentWrap.style.display = "none";
    parentSelect.innerHTML = "";
    return;
  }

  parentWrap.style.display = "grid";
  const options = structure
    .map((node) => `<option value="${node.id}">${node.nome}</option>`)
    .join("");
  parentSelect.innerHTML = options || '<option value="">Sem filho disponível</option>';
}

function addPlan(mode) {
  const nameInput = document.getElementById(`${mode}PlanName`);
  const groupSelect = document.getElementById(`${mode}PlanGroup`);
  const levelSelect = document.getElementById(`${mode}PlanLevel`);
  const parentSelect = document.getElementById(`${mode}PlanParent`);

  const nome = nameInput.value.trim();
  if (!nome) return;

  const collection = mode === "create" ? createCollections : editCollections;
  const group = groupSelect.value;
  const level = levelSelect.value;
  const node = { id: nextPlanNodeId++, nome, netos: [] };

  if (level === "filho") {
    collection.planosContas[group].push(node);
  } else {
    const parentId = Number(parentSelect.value);
    const parent = collection.planosContas[group].find((item) => item.id === parentId);
    if (!parent) return;
    parent.netos.push({ id: node.id, nome: node.nome });
  }

  nameInput.value = "";
  if (mode === "create") renderCreateCollections();
  if (mode === "edit") renderEditCollections();
}

function findAndUpdateNode(structureList, nodeId, action, newName) {
  for (const node of structureList) {
    if (node.id === nodeId) {
      if (action === "edit") node.nome = newName;
      return true;
    }

    for (const grand of node.netos || []) {
      if (grand.id === nodeId) {
        if (action === "edit") grand.nome = newName;
        return true;
      }
    }
  }

  return false;
}

function deleteNode(structureList, nodeId) {
  const parentIndex = structureList.findIndex((item) => item.id === nodeId);
  if (parentIndex >= 0) {
    structureList.splice(parentIndex, 1);
    return true;
  }

  for (const node of structureList) {
    const grandIndex = (node.netos || []).findIndex((item) => item.id === nodeId);
    if (grandIndex >= 0) {
      node.netos.splice(grandIndex, 1);
      return true;
    }
  }

  return false;
}

function handlePlanAction(mode, action, structure, nodeId) {
  const collection = mode === "create" ? createCollections : editCollections;
  const structureList = collection.planosContas[structure];

  if (action === "edit") {
    const current = prompt("Novo nome do plano:");
    if (!current) return;
    findAndUpdateNode(structureList, nodeId, "edit", current.trim());
  }

  if (action === "delete") {
    deleteNode(structureList, nodeId);
  }

  if (mode === "create") renderCreateCollections();
  if (mode === "edit") renderEditCollections();
}

function openCreateModal() {
  modal.hidden = false;
  form.reset();
  createCollections = { contasBancarias: [], pessoas: [], planosContas: createDefaultPlanos() };
  renderCreateCollections();
  setActiveTab(0);
}

function closeCreateModal() {
  modal.hidden = true;
  form.reset();
}

function openViewModal(companyId) {
  const company = companies.find((item) => item.id === companyId);
  if (!company) return;

  viewCompanyIdInput.value = String(company.id);
  companyViewForm.elements.nome.value = company.nome;
  companyViewForm.elements.cnpj.value = company.cnpj;
  companyViewForm.elements.responsavel.value = company.responsavel;
  companyViewForm.elements.email.value = company.email;
  companyViewForm.elements.telefone.value = company.telefone;
  companyViewForm.elements.status.value = company.status;

  editCollections = {
    contasBancarias: company.contasBancarias.map((item) => ({ ...item })),
    pessoas: company.pessoas.map((item) => ({ ...item })),
    planosContas: clonePlanos(company.planosContas)
  };

  renderEditCollections();
  setViewTab(0);
  companyViewModal.hidden = false;
}

function closeDetailsModal() {
  companyViewModal.hidden = true;
}

function addCreateBank() {
  const banco = document.getElementById("createBankName").value.trim();
  const agencia = document.getElementById("createBankAgency").value.trim();
  const conta = document.getElementById("createBankAccount").value.trim();
  const tipoConta = document.getElementById("createBankType").value;
  if (!banco || !agencia || !conta) return;
  createCollections.contasBancarias.push({ banco, agencia, conta, tipoConta });
  document.getElementById("createBankName").value = "";
  document.getElementById("createBankAgency").value = "";
  document.getElementById("createBankAccount").value = "";
  renderCreateCollections();
}

function addCreatePerson() {
  const nome = document.getElementById("createPersonName").value.trim();
  const documento = document.getElementById("createPersonDocument").value.trim();
  const planoConta = document.getElementById("createPersonAccountPlan").value;
  if (!nome || !documento) return;
  createCollections.pessoas.push({ nome, documento, planoConta });
  document.getElementById("createPersonName").value = "";
  document.getElementById("createPersonDocument").value = "";
  renderCreateCollections();
}

function addEditBank() {
  const banco = document.getElementById("editBankName").value.trim();
  const agencia = document.getElementById("editBankAgency").value.trim();
  const conta = document.getElementById("editBankAccount").value.trim();
  const tipoConta = document.getElementById("editBankType").value;
  if (!banco || !agencia || !conta) return;
  editCollections.contasBancarias.push({ banco, agencia, conta, tipoConta });
  document.getElementById("editBankName").value = "";
  document.getElementById("editBankAgency").value = "";
  document.getElementById("editBankAccount").value = "";
  renderEditCollections();
}

function addEditPerson() {
  const nome = document.getElementById("editPersonName").value.trim();
  const documento = document.getElementById("editPersonDocument").value.trim();
  const planoConta = document.getElementById("editPersonAccountPlan").value;
  if (!nome || !documento) return;
  editCollections.pessoas.push({ nome, documento, planoConta });
  document.getElementById("editPersonName").value = "";
  document.getElementById("editPersonDocument").value = "";
  renderEditCollections();
}

function renderCompanies() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  const filtered = companies.filter((company) => {
    const matchesSearch =
      company.nome.toLowerCase().includes(query) ||
      company.cnpj.toLowerCase().includes(query) ||
      company.responsavel.toLowerCase().includes(query) ||
      company.pessoas.some((item) => item.nome.toLowerCase().includes(query));

    const matchesStatus = selectedStatus === "todos" || company.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

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
});

modal.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".entry-remove");
  if (removeButton) {
    removeFromCollection(removeButton.dataset.mode, removeButton.dataset.type, Number(removeButton.dataset.index));
    return;
  }

  const actionButton = event.target.closest(".plan-edit, .plan-delete");
  if (actionButton) {
    handlePlanAction(
      actionButton.dataset.mode,
      actionButton.classList.contains("plan-edit") ? "edit" : "delete",
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

  const actionButton = event.target.closest(".plan-edit, .plan-delete");
  if (actionButton) {
    handlePlanAction(
      "edit",
      actionButton.classList.contains("plan-edit") ? "edit" : "delete",
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

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  if (!createCollections.pessoas.length) return;

  companies.unshift({
    id: nextCompanyId,
    nome: formData.get("nome"),
    cnpj: formData.get("cnpj"),
    responsavel: formData.get("responsavel"),
    email: formData.get("email"),
    telefone: formData.get("telefone"),
    status: formData.get("status"),
    fechamento: "-",
    contasBancarias: createCollections.contasBancarias.map((item) => ({ ...item })),
    pessoas: createCollections.pessoas.map((item) => ({ ...item })),
    planosContas: clonePlanos(createCollections.planosContas)
  });

  nextCompanyId += 1;
  closeCreateModal();
  renderCompanies();
});

companyViewForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const company = companies.find((item) => item.id === Number(viewCompanyIdInput.value));
  if (!company) return;

  company.nome = companyViewForm.elements.nome.value;
  company.cnpj = companyViewForm.elements.cnpj.value;
  company.responsavel = companyViewForm.elements.responsavel.value;
  company.email = companyViewForm.elements.email.value;
  company.telefone = companyViewForm.elements.telefone.value;
  company.status = companyViewForm.elements.status.value;
  company.contasBancarias = editCollections.contasBancarias.map((item) => ({ ...item }));
  company.pessoas = editCollections.pessoas.map((item) => ({ ...item }));
  company.planosContas = clonePlanos(editCollections.planosContas);

  renderCompanies();
  closeDetailsModal();
});

searchInput.addEventListener("input", renderCompanies);
statusFilter.addEventListener("change", renderCompanies);

renderCreateCollections();
setActiveTab(0);
renderCompanies();
