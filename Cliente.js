// Estabelece uma conexão com o servidor usando SSE
const eventSource = new EventSource('http://127.0.0.1:5000/sse');

// Trata eventos recebidos por SSE
eventSource.onmessage = function(event) {
    // Exibe dados do evento no console
    alert(event.data);

    // Converte os dados recebidos de uma string JSON para um objeto JavaScript
    jsonData = JSON.parse(event.data);
    const unsoldProducts = jsonData["unsold_products"];
    const lowStockProducts = jsonData["low_stock_products"]

    // Exibe os dados no console do navegador
    alert(unsoldProducts, lowStockProducts)

    // Construa a mensagem a ser exibida
    let mensagem = "Produtos não vendidos:\n";
    unsoldProducts.forEach(prod => {
        mensagem += `Código: ${prod.code}, Nome: ${prod.name}\n`;
    });
    mensagem += "\nProdutos com estoque baixo:\n"
    lowStockProducts.forEach(prod => {
        mensagem += `Código: ${prod.code}, Nome: ${prod.name}\n`;
    });

    // Exibe a mensagem em um alerta
    alert(mensagem);
};

// Obtém referência ao formulário de registro de usuário no HTML
const userRegistrationForm = document.getElementById('user-registration-form');

// Adiciona um evento de envio ao formulário de registro de usuário
userRegistrationForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const userNameInput = document.getElementById('user-name');
    const userName = userNameInput.value;

    // Envia solicitação de registro de usuário para o servidor
    fetch('http://127.0.0.1:5000/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: userName }),
    })
    .then((response) => response.json())
    .then((data) => {
        alert(data.message);
        userNameInput.value = ''; // Limpa o campo de entrada após o registro
        userRegistrationForm.style.display = "none";

        productRegistrationForm.style.display = "flex";

        const mainContent = document.getElementById('main')
        mainContent.style.removeProperty('display');
    })
    .catch((error) => {
        console.error('Erro no registro de usuário:', error);
    });

    // Chama a função para obter e exibir a lista de clientes
    fetchClientList();
});

// Função para buscar a lista de clientes do servidor
function fetchClientList() {
    fetch('http://127.0.0.1:5000/api/clients', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then((response) => response.json())
    .then((data) => {
        const clientList = document.getElementById('client-list');
        clientList.innerHTML = ''; // Limpa a lista existente

        // Adiciona cada cliente à lista
        data.forEach((client) => {
            const listItem = document.createElement('li');
            listItem.textContent = client;
            clientList.appendChild(listItem);
        });
    })
    .catch((error) => {
        console.error('Erro ao buscar a lista de clientes:', error);
    });
}

// Chama a função para buscar a lista de clientes assim que a página for carregada
fetchClientList();

// Obtém referência ao formulário de registro de produto no HTML
const productRegistrationForm = document.getElementById('product-registration-form');

// Adiciona um evento de envio ao formulário de registro de produto
productRegistrationForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Obtém valores dos campos do formulário
    const codeInput = document.getElementById('product-code');
    const nameInput = document.getElementById('product-name');
    const descriptionInput = document.getElementById('product-description');
    const priceInput = document.getElementById('price');
    const minStockInput = document.getElementById('product-minstock');

    const code = codeInput.value;
    const name = nameInput.value;
    const description = descriptionInput.value;
    const price = parseFloat(priceInput.value);
    const minStock = parseFloat(minStockInput.value);

    // Verifica se os campos não estão vazios
    if (code.trim() !== '' && name.trim() !== '' && !isNaN(price) && price >= 0 && !isNaN(minStock) && minStock >= 0) {
        // Cria um objeto de produto com as informações inseridas
        const product = {
            code,
            name,
            description,
            minStock,
            price,
        };

        // Envia solicitação de registro de produto para o servidor
        fetch('http://127.0.0.1:5000/api/products/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: product }),
        })
        .then((response) => response.json())
        .then((data) => {
            // Adiciona o produto à tabela se o registro for bem-sucedido
            if(data.message === "Produto registrado com sucesso") addProductToTable(product);
            alert(data.message);
        })
        .catch((error) => {
            console.error('Erro no registro de produto:', error);
        });

        // Limpa os campos de entrada
        codeInput.value = '';
        nameInput.value = '';
        priceInput.value = '';

        // Atualiza a lista de produtos
        fetchProductList();
    } else {
        // Exibe mensagem de erro se algum campo estiver vazio ou o preço for inválido
        alert('Por favor, preencha todos os campos corretamente.');
    }
});

// Função para adicionar um produto à tabela
function addProductToTable(product) {
    const productList = document.getElementById('product-list');
    const newRow = productList.insertRow();
    newRow.id = product.code; // Define o ID da linha igual ao código do produto

    // Adiciona células à nova linha
    const codeCell = newRow.insertCell(0);
    codeCell.textContent = product.code;

    const productCell = newRow.insertCell(1);
    productCell.textContent = product.name;

    const descriptionCell = newRow.insertCell(2);
    descriptionCell.textContent = product.description;

    const minStockCell = newRow.insertCell(3);
    minStockCell.textContent = product.minStock;

    const priceCell = newRow.insertCell(4);
    priceCell.textContent = product.price;

    const quantityCell = newRow.insertCell(5);
    quantityCell.textContent = product.quantity

    const actionsCell = newRow.insertCell(6);
    const addButton = document.createElement('button');
    addButton.textContent = 'Adicionar';
    const subtractButton = document.createElement('button');
    subtractButton.textContent = 'Subtrair';

    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.min = 0;
    quantityInput.value = product.quantity || 0; // Define o valor inicial como a quantidade do produto ou 0

    actionsCell.appendChild(quantityInput);
    actionsCell.appendChild(addButton);
    actionsCell.appendChild(subtractButton);

    // Adiciona manipuladores de eventos para os botões de adicionar e subtrair
    addButton.addEventListener('click', () => {
        const quantityToAdd = parseInt(quantityInput.value, 10);
        const productId = newRow.id; // Obtém o ID da linha atual

        // Verifica se o productId não está vazio
        if (productId) {
            // Envia solicitação para adicionar produto ao servidor com o ID e a quantidade
            fetch(`http://127.0.0.1:5000/api/products/entry/${productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quantityToAdd }),
            })
            .then((response) => response.json())
            .then((data) => {
                alert(data.message);
            })
            .catch((error) => {
                console.error('Erro ao adicionar produto:', error);
            });
        } else {
            console.error('ID da linha não encontrado.');
        }
        // Atualiza a lista de produtos
        fetchProductList();
    });

    subtractButton.addEventListener('click', () => {
        const quantityToSubtract = parseInt(quantityInput.value, 10);
        const productId = newRow.id; // Obtém o ID da linha atual

        // Verifica se o productId não está vazio
        if (productId) {
            // Envia solicitação para subtrair produto do servidor com o ID e a quantidade
            fetch(`http://127.0.0.1:5000/api/products/exit/${productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quantityToSubtract }), // Use um valor negativo para subtrair
            })
            .then((response) => response.json())
            .then((data) => {
                alert(data.message);
            })
            .catch((error) => {
                console.error('Erro ao subtrair produto:', error);
            });
        } else {
            console.error('ID da linha não encontrado.');
        }
        // Atualiza a lista de produtos
        fetchProductList();
    });
}

// Obtém referência ao botão de registro de produto no HTML
const registerProductButton = document.getElementById('add_product_button');

// Adiciona um evento de clique ao botão de registro de produto
registerProductButton.addEventListener('click', () => {
    // Alterna a visibilidade do formulário de registro de produto
    if (productRegistrationForm.style.display === 'none') {
        productRegistrationForm.style.display = 'flex';
    } else {
        productRegistrationForm.style.display = 'none';
    }
});

// Obtém referências aos elementos do relatório no HTML
const relatorio_popup = document.getElementById('relatorio');
const relatorioButton = document.getElementById('relatorio_button');

// Adiciona um evento de clique ao botão de relatório
relatorioButton.addEventListener('click', () => {
    // Alterna a visibilidade do elemento de relatório
    if (relatorio_popup.style.display === 'none') {
        relatorio_popup.style.display = 'flex';
    } else {
        relatorio_popup.style.display = 'none';
    }
});

// Obtém referências aos elementos do relatório de produtos não vendidos no HTML
const relatorioUnsold = document.getElementById('relatorio_unsold');
const relatorioUnsoldButton = document.getElementById('relatorio_unsold_button');

// Adiciona um evento de clique ao botão de relatório de produtos não vendidos
relatorioUnsoldButton.addEventListener('click', () => {
    // Alterna a visibilidade do elemento de relatório de produtos não vendidos
    if (relatorioUnsold.style.display === 'none') {
        relatorioUnsold.style.display = 'flex';
    } else {
        relatorioUnsold.style.display = 'none';
    }
});

// Obtém referências aos elementos da tabela de produtos no HTML
const tabelaProdutos = document.getElementById('tabela-produtos')
const tabelaButton = document.getElementById('table_button')

// Adiciona um evento de clique ao botão de exibição da tabela de produtos
tabelaButton.addEventListener('click', () => {
    // Verifica se a tabela de produtos está oculta
    if (tabelaProdutos.style.display === 'none') {
        // Remove a propriedade 'display' para tornar a tabela visível
        tabelaProdutos.style.removeProperty('display');
    } else {
        // Oculta a tabela de produtos
        tabelaProdutos.style.display = 'none';
    }
})

// Seleciona o formulário de relatório no HTML
const relatorioForm = document.getElementById('relatorio-form');

// Adiciona um evento de envio ao formulário de relatório
relatorioForm.addEventListener('submit', (event) => {
    event.preventDefault();
    // Obtém o valor dos minutos do input
    const minutesInput = document.getElementById('minutes');
    const minutes = parseInt(minutesInput.value, 10);

    // Verifica se os minutos são válidos
    if (!isNaN(minutes) && minutes >= 0) {
        const reportTable = document.getElementById('report-table');

        // Limpa os dados do relatório anterior
        reportTable.innerHTML = '';

        // Envia solicitação de relatório para o servidor
        fetch(`http://127.0.0.1:5000/api/reports/movements/${minutes}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then((response) => response.json())
        .then((data) => {
            // Adiciona as informações do relatório à tabela
            data.forEach((productInfo) => {
                alert(productInfo)
                const row = reportTable.insertRow();
                row.innerHTML = `
                    <td>${productInfo.code}</td>
                    <td>${productInfo.name}</td>
                    <td>
                        <ul>
                            ${productInfo.movements.map((movement) => `
                                <li>${movement.type}: ${movement.quantity} (${new Date(movement.time).toLocaleString()})</li>
                            `).join('')}
                        </ul>
                    </td>
                `;
            });

            // Exibe a tabela do relatório
            reportTable.style.removeProperty('display');
            alert('Relatório de Movimentos:', data);
        })
        .catch((error) => {
            console.error('Erro ao buscar o relatório:', error);
        });
    } else {
        // Exibe alerta se os minutos não forem válidos
        alert('Por favor, insira um valor válido para os minutos.');
    }
});

// Seleciona elementos do relatório de produtos não vendidos no HTML
const unsoldReportTable = document.getElementById('unsold-report-table');
const unsoldReportBody = document.getElementById('unsold-report-body');

// Seleciona o formulário do relatório de produtos não vendidos
const notSoldReportForm = document.getElementById('not-sold-report-form');

// Adiciona um evento de envio ao formulário de relatório de produtos não vendidos
notSoldReportForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Obtém o valor dos minutos do input
    const minutesInput = document.getElementById('not-sold-minutes');
    const minutes = parseInt(minutesInput.value, 10);

    // Verifica se os minutos são válidos
    if (!isNaN(minutes) && minutes >= 0) {
        // Limpa o conteúdo da tabela de relatório de produtos não vendidos
        unsoldReportTable.innerHTML = '';

        // Envia solicitação para obter relatório de produtos não vendidos do servidor
        fetch(`http://127.0.0.1:5000/api/reports/not-sold-since/${minutes}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then((response) => response.json())
        .then((data) => {
            // Limpa o conteúdo da tabela antes de adicionar os novos dados
            unsoldReportBody.innerHTML = '';

            // Adiciona informações do relatório à tabela
            data.forEach((productInfo) => {
                alert(productInfo)
                const row = unsoldReportTable.insertRow();
                row.innerHTML = `
                    <td>${productInfo.code}</td>
                    <td>${productInfo.name}</td>
                `;
            });

            // Exibe a tabela do relatório de produtos não vendidos
            unsoldReportTable.style.removeProperty('display');
            alert('Relatório de Produtos Não Vendidos:', data);
        })
        .catch((error) => {
            console.error('Erro ao buscar o relatório de produtos não vendidos:', error);
        });
    } else {
        // Exibe alerta se os minutos não forem válidos
        alert('Por favor, insira um valor válido para os minutos.');
    }
});

// Função para buscar a lista de produtos do servidor
function fetchProductList() {
    fetch('http://127.0.0.1:5000/api/products', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then((response) => response.json())
    .then((data) => {
        // Limpa a lista existente
        const productList = document.getElementById('product-list');
        productList.innerHTML = '';

        // Itera sobre os produtos recebidos e adiciona à tabela
        data.forEach((product) => {
            addProductToTable(product);
        });
    })
    .catch((error) => {
        alert('Erro ao buscar a lista de produtos:', error);
    });
}

// Chama a função para buscar a lista de produtos assim que a página for carregada
fetchProductList();
