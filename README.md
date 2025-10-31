# 💖 Garagem DreamHouse 💖

_Seu painel de controle automotivo, com um toque de glamour!_

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

---

## 📄 Sobre o Projeto

Bem-vindo(a) à Garagem DreamHouse! Este não é apenas um sistema de gerenciamento de veículos, é uma experiência completa. Desenvolvido com uma stack MERN (MongoDB, Express, Node.js) e um frontend em JavaScript puro, este projeto permite que usuários cadastrem, gerenciem e até compartilhem seus veículos com amigos.

O projeto foi construído do zero, focando em funcionalidades do mundo real como autenticação segura, upload de arquivos, consumo de APIs externas e um design interativo e responsivo.

---

## ✨ Funcionalidades Principais

*   **🔐 Autenticação Segura:** Sistema completo de registro e login de usuários utilizando JWT (JSON Web Tokens) para proteger as rotas.
*   **🚗 Gestão de Frota (CRUD):** Adicione, visualize, edite e remova veículos da sua garagem pessoal.
*   **🖼️ Upload de Imagens:** Dê vida aos seus veículos fazendo o upload de fotos, que são processadas e salvas no servidor.
*   **🤝 Compartilhamento de Veículos:** O proprietário de um veículo pode compartilhá-lo com outros usuários cadastrados na plataforma.
*   **🌦️ Planejador de Viagens:** Uma seção interativa que consome a API do OpenWeatherMap para mostrar a previsão do tempo de 1, 3 ou 5 dias para qualquer cidade.
*   **🎨 Tema Dinâmico:** Alterne entre os modos claro (tema Barbie) e escuro para uma melhor experiência de visualização.
*   **🔒 Segurança:** Uso de variáveis de ambiente (`.env`) para proteger dados sensíveis e `rate-limiter` para prevenir ataques de força bruta.

---

## 🚀 Tecnologias Utilizadas

O projeto é dividido em duas partes principais:

### **Frontend (Cliente)**
*   **HTML5**
*   **CSS3** (com design responsivo)
*   **JavaScript (ES6+)**: Manipulação do DOM, requisições `fetch` e interatividade.

### **Backend (Servidor)**
*   **Node.js**: Ambiente de execução do JavaScript no servidor.
*   **Express.js**: Framework para criação das rotas da API e gerenciamento do servidor.
*   **MongoDB**: Banco de dados NoSQL para armazenar os dados de usuários e veículos.
*   **Mongoose**: ODM para modelar os dados do MongoDB.
*   **`jsonwebtoken` e `bcryptjs`**: Para geração de tokens e criptografia de senhas.
*   **`multer`**: Middleware para gerenciar o upload de imagens.
*   **`dotenv`**: Para carregar variáveis de ambiente e proteger dados sensíveis.
*   **`helmet` e `cors`**: Middlewares de segurança para a aplicação.

---

## 🔧 Como Rodar o Projeto Localmente

Para ter a Garagem DreamHouse funcionando na sua máquina, siga estes passos:

### **Pré-requisitos**
*   [Node.js](https://nodejs.org/en/) instalado.
*   Uma conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) para obter a string de conexão do banco de dados.
*   Uma chave de API gratuita do [OpenWeatherMap](https://openweathermap.org/appid).

### **Passo a Passo**

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/nome-do-repositorio.git
    ```

2.  **Navegue até a pasta do projeto:**
    ```bash
    cd nome-do-repositorio
    ```

3.  **Instale todas as dependências do servidor:**
    ```bash
    npm install
    ```

4.  **Crie o arquivo de variáveis de ambiente:**
    Na raiz do projeto, crie um arquivo chamado `.env` e cole o conteúdo abaixo, substituindo os valores pelos seus dados:

    ```env
    # String de conexão do seu banco de dados no MongoDB Atlas
    MONGO_URI=mongodb+srv://seu_usuario:sua_senha@cluster...

    # Um segredo forte e aleatório para seus tokens JWT
    JWT_SECRET=SEU_SEGREDO_SUPER_SECRETO_AQUI

    # Sua chave de API obtida no site do OpenWeatherMap
    OPENWEATHER_API_KEY=SUA_CHAVE_DA_API_AQUI
    ```

5.  **Inicie o servidor:**
    ```bash
    node server.js
    ```
    Se tudo estiver correto, você verá uma mensagem no terminal confirmando que o servidor está rodando na porta 3001.

6.  **Acesse a aplicação:**
    Abra seu navegador e acesse [http://garagem-interativa-1.onrender.com](http://garagem-interativa-1.onrender.com). Pronto! Agora é só se cadastrar e aproveitar a sua Garagem DreamHouse.

---

## 💖 Feito com Carinho

Este projeto foi desenvolvido com muita dedicação. Sinta-se à vontade para explorar, contribuir e se divertir!

**KamillaMariaR**

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/KamillaMariaR))
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/seu-usuario/)

