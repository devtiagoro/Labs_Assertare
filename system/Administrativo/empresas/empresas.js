const companies = [
  {
    nome: "Mecânica Aurora Ltda",
    cnpj: "12.345.678/0001-90",
    responsavel: "Carlos Pereira",
    status: "ativa",
    fechamento: "05/03/2026"
  },
  {
    nome: "Clínica Vida Integrada",
    cnpj: "22.987.654/0001-11",
    responsavel: "Mariana Santos",
    status: "implantacao",
    fechamento: "-"
  },
  {
    nome: "Rede Mercado Central",
    cnpj: "45.777.111/0001-32",
    responsavel: "Fernanda Souza",
    status: "inativa",
    fechamento: "18/01/2026"
  }
];

const tableBody = document.getElementById("companiesTableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchCompany");
const statusFilter = document.getElementById("statusFilter");

function formatStatus(status) {
  if (status === "ativa") return "Ativa";
  if (status === "implantacao") return "Implantação";
  return "Inativa";
}

function renderCompanies() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  const filtered = companies.filter((company) => {
    const matchesSearch =
      company.nome.toLowerCase().includes(query) ||
      company.cnpj.toLowerCase().includes(query) ||
      company.responsavel.toLowerCase().includes(query);

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
      <td>${company.responsavel}</td>
      <td><span class="badge ${company.status}">${formatStatus(company.status)}</span></td>
      <td>${company.fechamento}</td>
      <td><a href="/system/Administrativo/empresas/nova-empresa.html" class="row-actions">Abrir</a></td>
    `;

    tableBody.appendChild(row);
  });
}

searchInput.addEventListener("input", renderCompanies);
statusFilter.addEventListener("change", renderCompanies);

renderCompanies();