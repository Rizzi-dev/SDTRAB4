// Estabelece uma conexão com o servidor usando SSE
let eventSource = new EventSource('http://127.0.0.1:5000/sse');

// Trata eventos recebidos por SSE
eventSource.onmessage = function(event) {
    // Exibe dados do evento no console
    console.log(event.data);

    // Converte os dados recebidos de uma string JSON para um objeto JavaScript
    jsonData = JSON.parse(event.data);
    let unsoldProducts = jsonData["unsold_products"];
    let lowStockProducts = jsonData["low_stock_products"]

    // Exibe os dados no console do navegador
    console.log(unsoldProducts, lowStockProducts)

    // letrua a mensagem a ser exibida
    let mensagem = "Produtos não vendidos:\n";
    unsoldProducts.forEach(prod => {
        mensagem += `Código: ${prod.code}, Nome: ${prod.name}\n`;
    });
    mensagem += "\nProdutos com estoque baixo:\n"
    lowStockProducts.forEach(prod => {
        mensagem += `Código: ${prod.code}, Nome: ${prod.name}\n`;
    });

    // Exibe a mensagem em um console.loga
    console.log(mensagem);
};

// Obtém referência ao formulário de registro de usuário no HTML
let userRegistrationForm = document.getElementById('user-registration-form');

// Adiciona um evento de envio ao formulário de registro de usuário
userRegistrationForm.addEventListener('submit', (event) => {
    event.preventDefault();
    let userNameInput = document.getElementById('user-name');
    let userName = userNameInput.value;

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
        console.log(data.message);
        userNameInput.value = ''; // Limpa o campo de entrada após o registro
        userRegistrationForm.style.display = "none";

        productRegistrationForm.style.display = "flex";

        let mainContent = document.getElementById('main')
        mainContent.style.removeProperty('display');
    })
    .catch((error) => {
        console.log('Erro no registro de usuário:', error);
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
        let clientList = document.getElementById('client-list');
        clientList.innerHTML = ''; // Limpa a lista existente

        // Adiciona cada cliente à lista
        data.forEach((client) => {
            let listItem = document.createElement('li');
            listItem.textContent = client;
            clientList.appendChild(listItem);
        });
    })
    .catch((error) => {
        console.log('Erro ao buscar a lista de clientes:', error);
    });
}

// Chama a função para buscar a lista de clientes assim que a página for carregada
fetchClientList();

// Obtém referência ao formulário de registro de produto no HTML
let productRegistrationForm = document.getElementById('product-registration-form');

// Adiciona um evento de envio ao formulário de registro de produto
productRegistrationForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Obtém valores dos campos do formulário
    let codeInput = document.getElementById('product-code');
    let nameInput = document.getElementById('product-name');
    let descriptionInput = document.getElementById('product-description');
    let priceInput = document.getElementById('price');
    let minStockInput = document.getElementById('product-minstock');

    let code = codeInput.value;
    let name = nameInput.value;
    let description = descriptionInput.value;
    let price = parseFloat(priceInput.value);
    let minStock = parseFloat(minStockInput.value);

    // Verifica se os campos não estão vazios
    if (code.trim() !== '' && name.trim() !== '' && !isNaN(price) && price >= 0 && !isNaN(minStock) && minStock >= 0) {
        // Cria um objeto de produto com as informações inseridas
        let product = {
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
            console.log(data.message);
        })
        .catch((error) => {
            console.log('Erro no registro de produto:', error);
        });

        // Limpa os campos de entrada
        codeInput.value = '';
        nameInput.value = '';
        priceInput.value = '';

        // Atualiza a lista de produtos
        fetchProductList();
    } else {
        // Exibe mensagem de erro se algum campo estiver vazio ou o preço for inválido
        console.log('Por favor, preencha todos os campos!');
    }
});

// Função para adicionar um produto à tabela
function addProductToTable(product) {
    let productList = document.getElementById('product-list');
    let newRow = productList.insertRow();
    // Define o ID da linha igual ao código do produto
    newRow.id = product.code; 
    

    // Adiciona células à nova linha
    let codeCell = newRow.insertCell(0);
    codeCell.textContent = product.code;

    let productCell = newRow.insertCell(1);
    productCell.textContent = product.name;

    let descriptionCell = newRow.insertCell(2);
    descriptionCell.textContent = product.description;

    let minStockCell = newRow.insertCell(3);
    minStockCell.textContent = product.minStock;

    let priceCell = newRow.insertCell(4);
    priceCell.textContent = product.price;

    let quantityCell = newRow.insertCell(5);
    quantityCell.textContent = product.quantity

    let actionsCell = newRow.insertCell(6);
    let addButton = document.createElement('button');
    addButton.textContent = 'Adicionar';
    let subtractButton = document.createElement('button');
    subtractButton.textContent = 'Subtrair';

    let quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.min = 0;
    // Define o valor inicial como a quantidade do produto ou 0
    quantityInput.value = product.quantity || 0; 

    actionsCell.appendChild(quantityInput);
    actionsCell.appendChild(addButton);
    actionsCell.appendChild(subtractButton);

    // Adiciona manipuladores de eventos para os botões de adicionar e subtrair
    addButton.addEventListener('click', () => {
        let quantityToAdd = parseInt(quantityInput.value, 10);
        let productId = newRow.id; // Obtém o ID da linha atual

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
                console.log(data.message);
            })
            .catch((error) => {
                console.log('Erro ao adicionar produto:', error);
            });
        } else {
            console.log('ID da linha não encontrado.');
        }
        // Atualiza a lista de produtos
        fetchProductList();
    });

    subtractButton.addEventListener('click', () => {
        let quantityToSubtract = parseInt(quantityInput.value, 10);
        let productId = newRow.id; // Obtém o ID da linha atual

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
                console.log(data.message);
            })
            .catch((error) => {
                console.log('Erro ao subtrair produto:', error);
            });
        } else {
            console.log('ID da linha não encontrado.');
        }
        // Atualiza a lista de produtos
        fetchProductList();
    });
}

// Obtém referência ao botão de registro de produto no HTML
let registerProductButton = document.getElementById('add_product_button');

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
let relatorio_popup = document.getElementById('relatorio');
let relatorioButton = document.getElementById('relatorio_button');

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
let relatorioUnsold = document.getElementById('relatorio_unsold');
let relatorioUnsoldButton = document.getElementById('relatorio_unsold_button');

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
let tabelaProdutos = document.getElementById('tabela-produtos')
let tabelaButton = document.getElementById('table_button')

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
let relatorioForm = document.getElementById('relatorio-form');

// Adiciona um evento de envio ao formulário de relatório
relatorioForm.addEventListener('submit', (event) => {
    event.preventDefault();
    // Obtém o valor dos minutos do input
    let minutesInput = document.getElementById('minutes');
    let minutes = parseInt(minutesInput.value, 10);

    // Verifica se os minutos são válidos
    if (!isNaN(minutes) && minutes >= 0) {
        let reportTable = document.getElementById('report-table');

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
                console.log(productInfo)
                let row = reportTable.insertRow();
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
            console.log('Relatório de Movimentos:', data);
        })
        .catch((error) => {
            console.log('Erro ao buscar o relatório:', error);
        });
    } else {
        // Exibe console.loga se os minutos não forem válidos
        console.log('Por favor, insira um valor válido para os minutos.');
    }
});

// Seleciona elementos do relatório de produtos não vendidos no HTML
let unsoldReportTable = document.getElementById('unsold-report-table');
let unsoldReportBody = document.getElementById('unsold-report-body');

// Seleciona o formulário do relatório de produtos não vendidos
let notSoldReportForm = document.getElementById('not-sold-report-form');

// Adiciona um evento de envio ao formulário de relatório de produtos não vendidos
notSoldReportForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Obtém o valor dos minutos do input
    let minutesInput = document.getElementById('not-sold-minutes');
    let minutes = parseInt(minutesInput.value, 10);

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
                console.log(productInfo)
                let row = unsoldReportTable.insertRow();
                row.innerHTML = `
                    <td>${productInfo.code}</td>
                    <td>${productInfo.name}</td>
                `;
            });

            // Exibe a tabela do relatório de produtos não vendidos
            unsoldReportTable.style.removeProperty('display');
            console.log('Relatório de Produtos Não Vendidos:', data);
        })
        .catch((error) => {
            console.log('Erro ao buscar o relatório de produtos não vendidos:', error);
        });
    } else {
        // Exibe console.loga se os minutos não forem válidos
        console.log('Por favor, insira um valor válido para os minutos.');
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
        let productList = document.getElementById('product-list');
        productList.innerHTML = '';

        // Itera sobre os produtos recebidos e adiciona à tabela
        data.forEach((product) => {
            addProductToTable(product);
        });
    })
    .catch((error) => {
        console.log('Erro ao buscar a lista de produtos:', error);
    });
}

// Chama a função para buscar a lista de produtos assim que a página for carregada
fetchProductList();
