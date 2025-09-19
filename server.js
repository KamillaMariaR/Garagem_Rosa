// server.js (Versão Final com Proteções de Segurança)

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const helmet = require('helmet'); // <-- ADICIONADO: Para segurança dos cabeçalhos HTTP
const rateLimit = require('express-rate-limit'); // <-- ADICIONADO: Para limitar requisições
require('dotenv').config(); 

const Veiculo = require('./models/veiculo.js'); 
const Manutencao = require('./models/Manutencao.js');

const app = express();
const PORT = process.env.PORT || 3001;

// --- CONFIGURAÇÃO DE SEGURANÇA ---
app.use(helmet()); // <-- ADICIONADO: Usa o Helmet para adicionar cabeçalhos de segurança essenciais

// ADICIONADO: Limitador geral para prevenir ataques de força bruta ou DoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Janela de 15 minutos
    max: 200, // Limita cada IP a 200 requisições a cada 15 minutos
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Muitas requisições enviadas deste IP, por favor, tente novamente mais tarde.'
});
app.use(limiter); // Aplica o limitador geral a todas as rotas

// ADICIONADO: Limitador mais estrito especificamente para a criação de veículos
const createVehicleLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // Janela de 1 hora
    max: 10, // Permite a criação de no máximo 10 veículos por IP a cada hora
    message: 'Você atingiu o limite de criação de veículos. Tente novamente mais tarde.',
});
// --- FIM DA CONFIGURAÇÃO DE SEGURANÇA ---


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')))

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error("ERRO FATAL: Variável MONGO_URI não definida! Verifique seu .env");
            process.exit(1);
        }
        await mongoose.connect(mongoUri);
        console.log("🚀 Conectado ao MongoDB Atlas!");
    } catch (err) {
        console.error("❌ ERRO FATAL ao conectar ao MongoDB:", err.message);
        process.exit(1);
    }
};

const servicosOferecidos = [
    { nome: "Troca de Óleo e Filtro", descricao: "Serviço completo.", precoEstimado: "R$ 250,00" },
    { nome: "Alinhamento e Balanceamento", descricao: "Direção mais segura.", precoEstimado: "R$ 150,00" },
];
const dicasGerais = [{dica: "Verifique a calibragem dos pneus semanalmente."}, {dica: "Troque o óleo no prazo."}];
const dicasPorTipo = {
    carro: [{dica: "Faça o rodízio dos pneus a cada 10.000 km."}],
    moto: [{dica: "Lubrifique a corrente regularmente."}],
};

// --- ROTAS DE VEÍCULOS ---
// ADICIONADO: O middleware 'createVehicleLimiter' foi aplicado a esta rota específica
app.post('/api/veiculos', createVehicleLimiter, async (req, res) => { 
    try { 
        const v = await Veiculo.create(req.body); 
        res.status(201).json(v); 
    } catch (e) { 
        res.status(400).json({ error: e.message }); 
    } 
});

app.get('/api/veiculos', async (req, res) => { 
    try { 
        const v = await Veiculo.find().sort({ createdAt: -1 }); 
        res.json(v); 
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    } 
});

// ALTERADO: Rota de atualização mais segura, definindo explicitamente os campos permitidos
app.put('/api/veiculos/:id', async (req, res) => { 
    try {
        // Extrai apenas os campos que o usuário pode modificar.
        // Isso previne que um invasor tente atualizar campos protegidos como 'createdAt'.
        const { marca, modelo, ano, cor } = req.body;
        const dadosParaAtualizar = { marca, modelo, ano, cor };

        const v = await Veiculo.findByIdAndUpdate(req.params.id, dadosParaAtualizar, { new: true, runValidators: true }); 
        
        if (!v) {
            return res.status(404).json({ error: 'Veículo não encontrado.' });
        }
        res.json(v); 
    } catch (e) { 
        res.status(400).json({ error: e.message }); 
    } 
});

app.delete('/api/veiculos/:id', async (req, res) => { 
    try { 
        await Manutencao.deleteMany({ veiculo: req.params.id }); 
        await Veiculo.findByIdAndDelete(req.params.id); 
        res.json({ message: 'Veículo deletado!' }); 
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    } 
});

// --- ROTAS DE MANUTENÇÃO ---
app.post('/api/veiculos/:veiculoId/manutencoes', async (req, res) => { 
    try { 
        const m = await Manutencao.create({ ...req.body, veiculo: req.params.veiculoId }); 
        res.status(201).json(m); 
    } catch (e) { 
        res.status(400).json({ error: e.message }); 
    } 
});

app.get('/api/veiculos/:veiculoId/manutencoes', async (req, res) => { 
    try { 
        const m = await Manutencao.find({ veiculo: req.params.veiculoId }).sort({ data: -1 }); 
        res.json(m); 
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    } 
});

// --- ROTAS DE GARAGEM ---
app.get('/api/garagem/veiculos-destaque', (req, res) => { 
    res.json([ 
        { modelo: "Honda Civic", ano: "2021", destaque: "O carro confiável", imagemUrl: "imagens/civic-removebg-preview.png" }, 
        { modelo: "Pagani Huayra", ano: "2023", destaque: "A pura esportividade", imagemUrl: "imagens/paganiRosa-removebg-preview.png" }, 
        { modelo: "Mercedes-Benz Actros", ano: "2022", destaque: "Força para o trabalho", imagemUrl: "imagens/caminhão-removebg-preview.png" }, 
        { modelo: "Kawasaki Ninja", ano: "2024", destaque: "Velocidade em duas rodas", imagemUrl: "imagens/kawasaki-Photoroom.png" } 
    ]); 
});
app.get('/api/garagem/servicos-oferecidos', (req, res) => res.json(servicosOferecidos));
app.get('/api/dicas-manutencao/:tipo?', (req, res) => res.json(dicasPorTipo[req.params.tipo?.toLowerCase()] || dicasGerais));

// --- ROTA DE CLIMA ---
app.get('/clima', async (req, res) => {
    const cidade = req.query.cidade;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
        console.error("ERRO: Chave da API OpenWeatherMap não encontrada. Verifique o .env");
        return res.status(500).json({ message: "Configuração do servidor incorreta." });
    }
    if (!cidade) {
        return res.status(400).json({ message: "O nome da cidade é obrigatório." });
    }
    
    const cidadeQuery = cidade.includes(',') ? cidade : `${cidade},BR`;
    const url = `http://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidadeQuery)}&appid=${apiKey}&units=metric&lang=pt_br`;
    
    console.log(`[CLIMA] Buscando por: "${cidadeQuery}"`);
    
    try {
        const response = await axios.get(url);
        res.json(response.data); 
    } catch (error) {
        const status = error.response?.status || 500;
        const message = status === 404 ? "Cidade não encontrada." : "Erro ao buscar dados do clima.";
        console.error(`[CLIMA] Erro ${status}: ${message}`);
        res.status(status).json({ message });
    }
});

// --- INICIALIZAÇÃO ---
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => console.log(`✅ Servidor da GARAGEM INTERATIVA rodando na porta ${PORT}`));
};

startServer();
