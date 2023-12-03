from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import json
import datetime
from time import sleep


# Criação da instância da aplicação Flask e habilitação do CORS
app = Flask("Servidor")
CORS(app)

#Classe que represeta o gerenciamento de Produto
class Product:
    def __init__(self, code, name, description, quantity, price, min_stock):
        #Inicialização dos atributos do produto
        self.code = code
        self.name = name
        self.description = description
        self.quantity = quantity
        self.price = price
        self.min_stock = min_stock
        self.movements = []

    def add_entry(self, quantity):
        #Adiciona uma entrada de produto ao estoque
        self.quantity = quantity
        self.movements.append((datetime.datetime.now(), "entrada", quantity))

    def add_exit(self, quantity):
        #Adiciona uma saída de produto do estoque, se a quantidade disponível for suficiente
        if self.quantity >= quantity:
            self.quantity -= quantity
            self.movements.append((datetime.datetime.now(), "saída", quantity))

    def get_stock_status(self):
        #Retorna o status do estoque do produto em um formato JSON
        return {
            "code": self.code,
            "name": self.name,
            "description": self.description,
            "quantity": self.quantity,
            "price": self.price,
            "min_stock": self.min_stock,
        }
    


# Classe que representa um usuário do sistema
class User:
    def __init__(self, name):
        self.name = name

#Dicionários para armazenar usuários e produtos
users={}
products={}

# Classe de gerenciamento do Estoque
@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.json
    name = data.get('name')
    response = ""
    if name not in users:
        #Cria um novo usuário e o adiciona ao dicionário de usuários
        user = User(name)
        users[name] = user
        response = f"Usuário {name} registrado com sucesso."
    else:
        response = f"Usuário {name} já está registrado."
    
    return jsonify({"message": response})



#Rota para registrar um novo produto
@app.route('/api/products/register', methods=['POST'])
def register_product():
    data = request.json
    data = data["data"]
    code = data.get('code')

    name = data.get('name')
    description = data.get('description')
    price = data.get('price')
    min_stock = data.get('min_stock')

    #Cria uma nova instância de produto e o adiciona ao dicionário de produtos
    product = Product(code, name, description, min_stock, price, min_stock)
    products[code] = product

    response = "Produto registrado com sucesso!"

    return jsonify({"message": response})


#Rota para registrar uma entrada de produto ao estoque
@app.route('/api/products/entry/<string:productId>', methods=['POST'])
def record_entry(productId):
    data = request.json
    quantity = data.get('quantityToAdd')

    response = ""
    if productId in products:
        #Adiciona uma entrada de produto ao estoque 
        response = "Produto adicionado"
        product = products[productId]
        product.add_entry(quantity)
    else:
        response = "Código não encontrado"
       
    return jsonify({"message": response})


#Rota para registrar uma saída de produto do estoque
@app.route('/api/products/exit/<string:productId>', methods=['POST'])
def record_exit(productId):
    data = request.json
    quantityToSubtract = data.get('quantityToSubtract')
 
    response = ""
    if productId in products:
         #Adiciona uma saída de produto do estoque, se a quantidade disponível for suficiente
        product = products[productId]

        if quantityToSubtract > 0 and quantityToSubtract <= product.quantity:
            product.add_exit(quantityToSubtract)
            response = "Produto removido do estoque."
        else:
            response = "Não foi possível remover este produto."

    else:
        response = "Produto não encontrado."

    return jsonify({"message": response})

#Rota para obter a lista de usuários
@app.route('/api/products', methods=['GET'])
def get_products():
    product_list = []
    for code, product in products.items():
        product_list.append(product.get_stock_status())
    return jsonify(product_list)


#Rota para obter a lista de usuários
@app.route('/api/clients', methods=['GET'])
def get_users():
    username_list = []
    for user in users:
        username_list.append(user)

    return jsonify(username_list)


#Rota para obter relatórios de movimentação de estoque dentro de um período específico
@app.route('/api/reports/movements/<int:date>', methods=['GET'])
def get_movement_reports(date):
    current_time = datetime.datetime.now()
    time = current_time - datetime.timedelta(minutes=date)

    fluxoMov = []
    for product in products.values():

        product_info = {
             "code": product.code,
             "name": product.name,
             "movements": []
        }

         # Filtrar os movimentos que ocorreram até 2 minutos atrás
        for movement_time, movement_type, movement_quantity in product.movements:
                 if movement_time >= time:
                    product_info["movements"].append({
                         "time": movement_time,
                         "type": movement_type,
                         "quantity": movement_quantity
                            })

        fluxoMov.append(product_info)


    return jsonify(fluxoMov)


#Rota para obter relatórios de produtos não vendidos dentro de um período específico
@app.route('/api/reports/not-sold-since/<int:date>', methods=['GET'])
def get_not_sold_reports(date):

    current_time = datetime.datetime.now()
    time_ago = current_time - datetime.timedelta(minutes=date)

    unsold_products = []

    for product in products.values():
        has_exit_movements = any(
            movement_time >= time_ago and movement_type == "saída"
            for movement_time, movement_type, _ in product.movements
        )


        if not has_exit_movements:
            unsold_products.append({
                 "code": product.code,
                 "name": product.name
                    })


    return jsonify(unsold_products)


# Função para verificar produtos não vendidos e produtos com baixo estoque nos últimos 2 minutos
def check_unsold_lowstock():
    current_time = datetime.datetime.now()
    time_ago = current_time - datetime.timedelta(minutes=2)

    unsold_products = []
    low_stock_products = []

    for product in products.values():
        has_exit_movements = any(
            movement_time >= time_ago and movement_type == "saída"
            for movement_time, movement_type, _ in product.movements
        )


        if not has_exit_movements:
            unsold_products.append({
                 "code": product.code,
                 "name": product.name
                    })

        if product.quantity < product.min_stock:
            low_stock_products.append({
                 "code": product.code,
                 "name": product.name
                    })

    combined_data = {
        "unsold_products": unsold_products,
        "low_stock_products": low_stock_products
    }

    return combined_data


#Rota do SSE
@app.route('/sse')
def sse_demo():
    def check():
        #Pausa a execução por 30 segundos
        sleep(30)
        #Chama a função para verificar produtos não vendidos e com baixo estoque
        unsold_products = check_unsold_lowstock()
        return "data: {}\n\n".format(json.dumps(unsold_products))

    return Response(
        check(),
        mimetype='text/event-stream'
    )


#Inicia a aplicação Flask em modo debug
app.run(debug=True)


