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
    conta: { banco: "Itaú", agencia: "1234", conta: "8899-0", tipoConta: "Conta corrente" },
    cliente: { nome: "Ana Paula Costa", documento: "123.456.789-00" },
    fornecedor: { nome: "Suprimentos Brasil", documento: "44.555.666/0001-21" }
  }
];

let nextCompanyId = 2;

const tableBody = document.getElementById("companiesTableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchCompany");
const statusFilter = document.getElementById("statusFilter");

const modal = document.getElementById("companyModal");
const openModalButton = document.getElementById("openCompanyModal");
const closeModalButton = document.getElementById("closeCompanyModal");
const form = document.getElementById("companyForm");
const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
const tabPanels = Array.from(document.querySelectorAll(".tab-panel"));
const previousTabButton = document.getElementById("previousTab");
const nextTabButton = document.getElementById("nextTab");

const companyViewModal = document.getElementById("companyViewModal");
const companyViewContent = document.getElementById("companyViewContent");
const closeViewModal = document.getElementById("closeViewModal");
const closeViewModalBottom = document.getElementById("closeViewModalBottom");

let activeTabIndex = 0;

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

function openCreateModal() {
  modal.hidden = false;
  setActiveTab(0);
}

function closeCreateModal() {
  modal.hidden = true;
  form.reset();
}

function openViewModal(companyId) {
  const company = companies.find((item) => item.id === companyId);
  if (!company) return;

  companyViewContent.innerHTML = `
    <section class="view-section">
      <h3>Informações cadastrais</h3>
      <div class="view-grid">
        <div><strong>Empresa:</strong> ${company.nome}</div>
        <div><strong>CNPJ:</strong> ${company.cnpj}</div>
        <div><strong>Responsável:</strong> ${company.responsavel}</div>
        <div><strong>Email:</strong> ${company.email}</div>
        <div><strong>Telefone:</strong> ${company.telefone}</div>
        <div><strong>Status:</strong> ${formatStatus(company.status)}</div>
      </div>
    </section>

    <section class="view-section">
      <h3>Conta bancária</h3>
      <div class="view-grid">
        <div><strong>Banco:</strong> ${company.conta.banco}</div>
        <div><strong>Agência:</strong> ${company.conta.agencia}</div>
        <div><strong>Conta:</strong> ${company.conta.conta}</div>
        <div><strong>Tipo:</strong> ${company.conta.tipoConta}</div>
      </div>
    </section>

    <section class="view-section">
      <h3>Cliente e fornecedor</h3>
      <div class="view-grid">
        <div><strong>Cliente:</strong> ${company.cliente.nome}</div>
        <div><strong>CPF/CNPJ do cliente:</strong> ${company.cliente.documento}</div>
        <div><strong>Fornecedor:</strong> ${company.fornecedor.nome}</div>
        <div><strong>CPF/CNPJ do fornecedor:</strong> ${company.fornecedor.documento}</div>
      </div>
    </section>
  `;

  companyViewModal.hidden = false;
}

function closeDetailsModal() {
  companyViewModal.hidden = true;
}

function renderCompanies() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  const filtered = companies.filter((company) => {
    const matchesSearch =
      company.nome.toLowerCase().includes(query) ||
      company.cnpj.toLowerCase().includes(query) ||
      company.responsavel.toLowerCase().includes(query) ||
      company.cliente.nome.toLowerCase().includes(query);

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
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${company.nome}</td>
      <td>${company.cnpj}</td>
      <td>${company.cliente.nome} (${company.cliente.documento})</td>
      <td><span class="badge ${company.status}">${formatStatus(company.status)}</span></td>
      <td>${company.fechamento}</td>
      <td class="cell-actions">
        <button type="button" class="btn secondary edit-button" data-company-id="${company.id}">Editar</button>
      </td>
    `;

    tableBody.appendChild(row);
  });
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

tableBody.addEventListener("click", (event) => {
  const target = event.target.closest(".edit-button");
  if (!target) return;

  const companyId = Number(target.dataset.companyId);
  openViewModal(companyId);
});

tabButtons.forEach((button, idx) => {
  button.addEventListener("click", () => setActiveTab(idx));
});

previousTabButton.addEventListener("click", () => {
  if (activeTabIndex > 0) setActiveTab(activeTabIndex - 1);
});

nextTabButton.addEventListener("click", () => {
  if (activeTabIndex < tabButtons.length - 1) setActiveTab(activeTabIndex + 1);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);

  companies.unshift({
    id: nextCompanyId,
    nome: formData.get("nome"),
    cnpj: formData.get("cnpj"),
    responsavel: formData.get("responsavel"),
    email: formData.get("email"),
    telefone: formData.get("telefone"),
    status: formData.get("status"),
    fechamento: "-",
    conta: {
      banco: formData.get("banco"),
      agencia: formData.get("agencia"),
      conta: formData.get("conta"),
      tipoConta: formData.get("tipoConta")
    },
    cliente: {
      nome: formData.get("clienteNome"),
      documento: formData.get("clienteDocumento")
    },
    fornecedor: {
      nome: formData.get("fornecedorNome"),
      documento: formData.get("fornecedorDocumento")
    }
  });

  nextCompanyId += 1;
  closeCreateModal();
  renderCompanies();
});

searchInput.addEventListener("input", renderCompanies);
statusFilter.addEventListener("change", renderCompanies);

setActiveTab(0);
renderCompanies();