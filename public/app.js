let API = "http://localhost:3000";

try { 
    API = localStorage.getItem("apiUrl") || API; 
} catch (e) { }

const $ = (id) => document.getElementById(id);
$("apiUrl").value = API; // Corrigido: apiUrl precisa estar entre aspas

function setStatus(ok, msg) {
    const s = $("status");
    s.className = "status " + (ok ? "ok" : "off"); // Adicionado espaço para a classe css
    s.textContent = msg;
}

async function carregarCategorias() {
    const resp = await fetch(`${API}/categorias`); // Corrigido: Template string com ${API}
    const cast = await resp.json();

    const selForm = $("categoriaId");
    const selFiltro = $("filtroCategoria");

    selForm.innerHTML = "";
    selFiltro.innerHTML = '<option value="">Todas as categorias</option>'; // Corrigido: 'value' e 'Todas'

    cast.forEach((c) => {
        // Corrigido: Removidos fechamentos de parênteses e strings perdidos no HTML
        selForm.insertAdjacentHTML("beforeend", `<option value="${c.id}">${c.nome}</option>`);
        selFiltro.insertAdjacentHTML("beforeend", `<option value="${c.id}">${c.nome}</option>`);
    });
}

async function carregarProdutos() {
    const params = new URLSearchParams();
    // Corrigido: "filtroCategoria" estava escrito errado no primeiro IF
    if ($("filtroCategoria").value) params.set("categorias", $("filtroCategoria").value);
    if ($("ordenar").value) params.set("ordenar", $("ordenar").value); // Corrigido: ordenar entre aspas

    const resp = await fetch(`${API}/produtos?${params}`);
    const produtos = await resp.json();
    const ul = $("lista"); // Corrigido: lista entre aspas
    ul.innerHTML = "";
    
    // Corrigido: 'length' estava escrito errado (lenght)
    $("vazio").textContent = produtos.length ? "" : "Nenhum produto cadastrado";
    
    produtos.forEach((p) => {
        const li = document.createElement("li");
        li.className = "item";
        // Corrigido: Falta de sinal de igual em style, erro em align-items e fechamento da tag <li>
        li.innerHTML = `
        <div>
            <div class="nome">${p.nome}</div>
            <div class="meta">${p.categoria} · estoque: ${p.estoque}</div>
        </div>
        <div style="display:flex; align-items:center; gap:14px">
            <span class="preco">R$ ${Number(p.preco).toFixed(2)}</span>
            <div class="btns">
                <button data-ed="${p.id}">Editar</button>
                <button class="del" data-del="${p.id}">Excluir</button>
            </div>
        </div>`; // Corrigido data-del para bater com o event listener abaixo
        ul.appendChild(li);
    });
}

async function conectar() {
    API = $("apiUrl").value.trim().replace(/\/$/, "");
    try { localStorage.setItem("apiUrl", API); } catch (e) { }
    try {
        await carregarCategorias();
        await carregarProdutos();
        setStatus(true, "conectado");
    } catch (e) {
        setStatus(false, "sem conexão com a API");
    }
}

function entrarEdicao(p) {
    // Corrigido: 'editId' e 'formTitulo' (estavam com caracteres diferentes do limparForm)
    $("editId").value = p.id;
    $("nome").value = p.nome;
    $("preco").value = p.preco;
    $("estoque").value = p.estoque;
    // Corrigido: JavaScript diferencia maiúsculas, alterado para p.categoriaId se sua API mandar assim
    $("categoriaId").value = p.categoriaId || p.categoriaid; 
    $("formTitulo").textContent = "Editar produto";
    $("salvarProduto").textContent = "Salvar";
    $("cancelar").hidden = false;
}

function limparForm() {
    $("editId").value = "";
    $("nome").value = $("preco").value = $("estoque").value = "";
    $("formTitulo").textContent = "Novo produto";
    $("salvarProduto").textContent = "Adicionar";
    $("cancelar").hidden = true;
    $("formErro").textContent = "";
}

async function salvarProduto() {
    const corpo = {
        nome: $("nome").value,
        preco: $("preco").value,
        estoque: $("estoque").value,
        categoriaId: $("categoriaId").value,
    };
    const id = $("editId").value;
    const url = id ? `${API}/produtos/${id}` : `${API}/produtos`;
    const metodo = id ? "PUT" : "POST";
    
    try {
        const resp = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(corpo),
        });
        const dados = await resp.json();
        if (!resp.ok) { 
            $("formErro").textContent = "⚠️ " + (dados.erro || "Erro"); 
            return; 
        }
        limparForm();
        carregarProdutos();
    } catch (e) {
        $("formErro").textContent = "⚠️ Erro ao salvar produto";
    }
}

document.addEventListener("click", async (e) => {
    // Corrigido: Adicionado crases invisíveis que faltavam no `${API}` do seu código original
    if (e.target.dataset.del) {
        await fetch(`${API}/produtos/${e.target.dataset.del}`, { method: "DELETE" });
        carregarProdutos();
    }
    if (e.target.dataset.ed) {
        const resp = await fetch(`${API}/produtos/${e.target.dataset.ed}`);
        entrarEdicao(await resp.json());
    }
});

$("salvarUrl").addEventListener("click", conectar);
$("salvarProduto").addEventListener("click", salvarProduto);
$("cancelar").addEventListener("click", limparForm);
$("recarregar").addEventListener("click", carregarProdutos);
$("filtroCategoria").addEventListener("change", carregarProdutos);
$("ordenar").addEventListener("change", carregarProdutos);

conectar();
