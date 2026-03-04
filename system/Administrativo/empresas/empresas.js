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
  const levelLabel = level === "pai" ? "Pai" : level === "filho" ? "Filho" : "Neto";
  const addLabel = level === "pai" ? "+ Filho" : "+ Neto";
  const addButton = level === "neto"
    ? ""
    : `<button type="button" class="plan-add" data-mode="${mode}" data-structure="${structure}" data-level="${level}" data-node-id="${node.id}">${addLabel}</button>`;

  const childrenHtml = level === "pai"
    ? `<div class="plan-children">${(node.filhos || []).map((child) => nodeTemplate(child, structure, "filho", mode)).join("")}</div>`
    : "";

  const grandchildrenHtml = level === "filho"
    ? `<div class="plan-grandchildren">${(node.netos || []).map((grand) => nodeTemplate(grand, structure, "neto", mode)).join("")}</div>`
    : "";

  return `
    <div class="plan-node level-${level}">
      <div class="plan-line">
        <span class="plan-label"><strong>${levelLabel}:</strong> ${node.nome}</span>
        <div class="plan-actions">
          ${addButton}
          <button type="button" class="plan-edit" data-mode="${mode}" data-structure="${structure}" data-level="${level}" data-node-id="${node.id}">Editar</button>
          <button type="button" class="plan-delete" data-mode="${mode}" data-structure="${structure}" data-level="${level}" data-node-id="${node.id}">Excluir</button>
        </div>
      </div>
      ${childrenHtml}
      ${grandchildrenHtml}
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
        ? `<div class="plan-parents">${nodes.map((node) => nodeTemplate(node, structure.key, "pai", mode)).join("")}</div>`
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
  const childSelect = document.getElementById(`${mode}PlanChild`);
  const parentWrap = document.getElementById(`${mode}PlanParentWrap`);
  const childWrap = document.getElementById(`${mode}PlanChildWrap`);

  if (!groupSelect || !levelSelect || !parentSelect || !childSelect || !parentWrap || !childWrap) return;

  const collection = mode === "create" ? createCollections : editCollections;
  const parentNodes = collection.planosContas[groupSelect.value] || [];
  const level = levelSelect.value;

  parentWrap.style.display = level === "filho" || level === "neto" ? "grid" : "none";
  childWrap.style.display = level === "neto" ? "grid" : "none";

  parentSelect.innerHTML = parentNodes.map((node) => `<option value="${node.id}">${node.nome}</option>`).join("");

  if (!parentNodes.length) {
    parentSelect.innerHTML = '<option value="">Sem conta pai</option>';
    childSelect.innerHTML = '<option value="">Sem conta filho</option>';
    return;
  }

  const selectedParentId = Number(parentSelect.value || parentNodes[0].id);
  const selectedParent = parentNodes.find((node) => node.id === selectedParentId) || parentNodes[0];

  if (level === "neto") {
    const children = selectedParent.filhos || [];
    childSelect.innerHTML = children.map((child) => `<option value="${child.id}">${child.nome}</option>`).join("") || '<option value="">Sem conta filho</option>';
  } else {
    childSelect.innerHTML = "";
  }
}

function addPlan(mode) {
  const nameInput = document.getElementById(`${mode}PlanName`);
  const groupSelect = document.getElementById(`${mode}PlanGroup`);
  const levelSelect = document.getElementById(`${mode}PlanLevel`);
  const parentSelect = document.getElementById(`${mode}PlanParent`);
  const childSelect = document.getElementById(`${mode}PlanChild`);

  const nome = nameInput.value.trim();
  if (!nome) return;

  const collection = mode === "create" ? createCollections : editCollections;
  const structure = collection.planosContas[groupSelect.value];
  const level = levelSelect.value;

  if (level === "pai") {
    structure.push({ id: nextPlanNodeId++, nome, filhos: [] });
  }

  if (level === "filho") {
    const parent = structure.find((node) => node.id === Number(parentSelect.value));
    if (!parent) return;
    parent.filhos.push({ id: nextPlanNodeId++, nome, netos: [] });
  }

  if (level === "neto") {
    const parent = structure.find((node) => node.id === Number(parentSelect.value));
    if (!parent) return;
    const child = (parent.filhos || []).find((item) => item.id === Number(childSelect.value));
    if (!child) return;
    child.netos.push({ id: nextPlanNodeId++, nome });
  }

  nameInput.value = "";
  if (mode === "create") renderCreateCollections();
  if (mode === "edit") renderEditCollections();
}

function findNodeById(structureList, nodeId) {
  for (const parent of structureList) {
    if (parent.id === nodeId) return { node: parent, level: "pai", parent: null, structure: parent };
    for (const child of parent.filhos || []) {
      if (child.id === nodeId) return { node: child, level: "filho", parent, structure: parent };
      for (const grand of child.netos || []) {
        if (grand.id === nodeId) return { node: grand, level: "neto", parent: child, structure: parent };
      }
    }
  }
  return null;
}

function updateNodeName(structureList, nodeId, newName) {
  const found = findNodeById(structureList, nodeId);
  if (!found) return;
  found.node.nome = newName;
}

function deleteNode(structureList, nodeId) {
  const found = findNodeById(structureList, nodeId);
  if (!found) return;

  if (found.level === "pai") {
    const idx = structureList.findIndex((item) => item.id === nodeId);
    if (idx >= 0) structureList.splice(idx, 1);
    return;
  }

  if (found.level === "filho") {
    found.structure.filhos = (found.structure.filhos || []).filter((item) => item.id !== nodeId);
    return;
  }

  if (found.level === "neto") {
    found.parent.netos = (found.parent.netos || []).filter((item) => item.id !== nodeId);
  }
}

function addPlanFromNode(mode, structureKey, level, nodeId) {
  const collection = mode === "create" ? createCollections : editCollections;
  const structureList = collection.planosContas[structureKey];
  const label = level === "pai" ? "filho" : "neto";
  const nome = prompt(`Nome do ${label}:`);
  if (!nome || !nome.trim()) return;

  const found = findNodeById(structureList, nodeId);
  if (!found) return;

  if (level === "pai") {
    found.node.filhos = found.node.filhos || [];
    found.node.filhos.push({ id: nextPlanNodeId++, nome: nome.trim(), netos: [] });
  } else if (level === "filho") {
    found.node.netos = found.node.netos || [];
    found.node.netos.push({ id: nextPlanNodeId++, nome: nome.trim() });
  } else if (level === "neto") {
    found.parent.netos = found.parent.netos || [];
    found.parent.netos.push({ id: nextPlanNodeId++, nome: nome.trim() });
  }

  if (mode === "create") renderCreateCollections();
  if (mode === "edit") renderEditCollections();
}

function handlePlanAction(mode, action, structure, nodeId) {
  const collection = mode === "create" ? createCollections : editCollections;
  const structureList = collection.planosContas[structure];

  if (action === "add") {
    const found = findNodeById(structureList, nodeId);
    if (!found || found.level === "neto") return;
    addPlanFromNode(mode, structure, found.level, nodeId);
    return;
  }

  if (action === "edit") {
    const nextName = prompt("Novo nome do plano:");
    if (!nextName) return;
    updateNodeName(structureList, nodeId, nextName.trim());
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
      actionButton.classList.contains("plan-add") ? "add" : actionButton.classList.contains("plan-edit") ? "edit" : "delete",
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
      actionButton.classList.contains("plan-add") ? "add" : actionButton.classList.contains("plan-edit") ? "edit" : "delete",
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