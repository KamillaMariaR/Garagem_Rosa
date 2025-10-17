// server.js (VERSÃO FINAL, COMPLETA E CORRIGIDA)

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Imports para autenticação
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Models e Middleware (NA ORDEM CORRETA PARA O .populate() FUNCIONAR)
const User = require('./models/User.js');
const Veiculo = require('./models/veiculo.js');
const Manutencao = require('./models/Manutencao.js');
const authMiddleware = require('./middleware/auth.js');

const app = express();
const PORT = process.env.PORT || 3001;

// --- CONFIGURAÇÃO DE SEGURANÇA E MIDDLEWARES GERAIS ---
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "connect-src": ["'self'", "https://garagem-interativa-1.onrender.com", "http://localhost:3001", "http://api.openweathermap.org"],
        "img-src": ["'self'", "data:", "https://openweathermap.org"],
      },
    },
  })
);
app.use(cors());
app.use(express.json());

// Limitadores de requisição
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use(limiter);
const createVehicleLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'Você atingiu o limite de criação de veículos.' });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: 'Muitas tentativas de autenticação.' });

// --- CONEXÃO COM O BANCO DE DADOS ---
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error("ERRO FATAL: Variável MONGO_URI não definida!");
        if (!process.env.JWT_SECRET) throw new Error("ERRO FATAL: Variável JWT_SECRET não definida!");
        await mongoose.connect(mongoUri);
        console.log("🚀 Conectado ao MongoDB Atlas!");
    } catch (err) {
        console.error("❌ ERRO FATAL ao conectar ao MongoDB:", err.message);
        process.exit(1);
    }
};

// ==========================================================
// === DEFINIÇÃO DAS ROTAS DA API ===
// ==========================================================

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        if (await User.findOne({ email })) return res.status(400).json({ error: 'Usuário com este e-mail já existe.' });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = new User({ email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'Credenciais inválidas.' });
        }
        const payload = { userId: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token, email: user.email });
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});

// --- ROTAS DE VEÍCULOS (PROTEGIDAS) ---
app.post('/api/veiculos', authMiddleware, createVehicleLimiter, async (req, res) => {
    try {
        const v = await Veiculo.create({ ...req.body, owner: req.userId });
        res.status(201).json(v);
    } catch (e) {
        if (e.code === 11000) return res.status(400).json({ error: 'Você já possui um veículo com esta placa.' });
        res.status(400).json({ error: e.message });
    }
});

// Rota de listagem de veículos CORRIGIDA E ÚNICA
app.get('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const veiculos = await Veiculo.find({
            $or: [
                { owner: req.userId },       // Veículos que eu possuo
                { sharedWith: req.userId }   // Veículos compartilhados comigo
            ]
        })
        .populate('owner', 'email') // Traz o e-mail do dono
        .sort({ createdAt: -1 });

        res.json(veiculos);
    } catch (e) {
        console.error("Erro ao listar veículos:", e.message);
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findById(req.params.id);
        if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado.' });
        if (veiculo.owner.toString() !== req.userId) return res.status(403).json({ error: 'Acesso negado.' });
        const v = await Veiculo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json(v);
    } catch (e) {
        if (e.code === 11000) return res.status(400).json({ error: 'Você já possui um veículo com esta placa.' });
        res.status(400).json({ error: e.message });
    }
});

app.delete('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findById(req.params.id);
        if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado.' });
        if (veiculo.owner.toString() !== req.userId) return res.status(403).json({ error: 'Acesso negado.' });
        await Manutencao.deleteMany({ veiculo: req.params.id });
        await Veiculo.findByIdAndDelete(req.params.id);
        res.json({ message: 'Veículo deletado!' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/veiculos/:veiculoId/share', authMiddleware, async (req, res) => {
    try {
        const { email } = req.body;
        const { veiculoId } = req.params;
        const veiculo = await Veiculo.findById(veiculoId);
        if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado.' });
        if (veiculo.owner.toString() !== req.userId) return res.status(403).json({ error: 'Acesso negado. Você não é o proprietário.' });
        const userToShareWith = await User.findOne({ email });
        if (!userToShareWith) return res.status(404).json({ error: `Usuário com o e-mail "${email}" não encontrado.` });
        if (userToShareWith.id === req.userId) return res.status(400).json({ error: 'Você não pode compartilhar um veículo com você mesmo.' });
        if (veiculo.sharedWith.includes(userToShareWith.id)) return res.status(400).json({ error: `Este veículo já está compartilhado com ${email}.` });
        veiculo.sharedWith.push(userToShareWith.id);
        await veiculo.save();
        res.status(200).json({ message: `Veículo compartilhado com sucesso com ${email}!` });
    } catch (e) {
        console.error("Erro ao compartilhar veículo:", e.message);
        res.status(500).json({ error: 'Erro no servidor ao tentar compartilhar.' });
    }
});

// --- ROTAS DE MANUTENÇÃO (PROTEGIDAS) ---
app.post('/api/veiculos/:veiculoId/manutencoes', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findById(req.params.veiculoId);
        if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado.' });
        if (veiculo.owner.toString() !== req.userId) return res.status(403).json({ error: 'Acesso negado.' });
        const m = await Manutencao.create({ ...req.body, veiculo: req.params.veiculoId });
        res.status(201).json(m);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// ROTA DE LISTAGEM DE MANUTENÇÃO QUE ESTAVA FALTANDO
app.get('/api/veiculos', authMiddleware, async (req, res) => {
    console.log("\n--- NOVA REQUISIÇÃO PARA /api/veiculos ---");
    
    try {
        // PASSO 1: Confirmar o ID do usuário logado
        const userId = req.userId;
        console.log("PASSO 1: ID do usuário logado (req.userId):", userId);
        if (!userId) {
            console.log("ERRO: req.userId está nulo ou indefinido. O middleware de autenticação pode ter falhado.");
            return res.status(401).json({ error: "ID de usuário não encontrado no token." });
        }

        // PASSO 2: Executar a busca SEM o .populate()
        console.log("PASSO 2: Executando a consulta ao banco de dados...");
        const query = {
            $or: [
                { owner: userId },
                { sharedWith: userId }
            ]
        };
        console.log("Consulta (Query):", JSON.stringify(query, null, 2));
        
        const veiculosSemPopulate = await Veiculo.find(query);
        
        console.log(`PASSO 3: Encontrados ${veiculosSemPopulate.length} veículos ANTES do populate.`);
        if (veiculosSemPopulate.length > 0) {
            console.log("Primeiro veículo encontrado (sem populate):", veiculosSemPopulate[0]);
        }

        // PASSO 4: Executar a busca COMPLETA com o .populate()
        console.log("PASSO 4: Re-executando a consulta COM o .populate('owner', 'email')...");
        
        const veiculosComPopulate = await Veiculo.find(query)
            .populate('owner', 'email')
            .sort({ createdAt: -1 });

        console.log(`PASSO 5: Encontrados ${veiculosComPopulate.length} veículos DEPOIS do populate.`);
        if (veiculosComPopulate.length > 0) {
            console.log("Primeiro veículo encontrado (COM populate):", veiculosComPopulate[0]);
            console.log("Tipo do campo 'owner' no primeiro veículo:", typeof veiculosComPopulate[0].owner);
        }

        console.log("--- FIM DA REQUISIÇÃO ---");
        res.json(veiculosComPopulate);

    } catch (e) {
        console.error("ERRO CRÍTICO NA ROTA /api/veiculos:", e);
        res.status(500).json({ error: "Erro interno do servidor.", details: e.message });
    }
});

// --- ROTAS PÚBLICAS ---
const servicosOferecidos = [
    { nome: "Troca de Óleo e Filtro", descricao: "Serviço completo.", precoEstimado: "R$ 250,00" },
    { nome: "Alinhamento e Balanceamento", descricao: "Direção mais segura.", precoEstimado: "R$ 150,00" },
];
const dicasGerais = [{ dica: "Verifique a calibragem dos pneus semanalmente." }, { dica: "Troque o óleo no prazo." }];
const dicasPorTipo = {
    carro: [{ dica: "Faça o rodízio dos pneus a cada 10.000 km." }],
    moto: [{ dica: "Lubrifique a corrente regularmente." }],
};
app.get('/api/garagem/veiculos-destaque', (req, res) => res.json([
    { modelo: "Honda Civic", ano: "2021", destaque: "O carro confiável", imagemUrl: "imagens/civic-removebg-preview.png" },
    { modelo: "Pagani Huayra", ano: "2023", destaque: "A pura esportividade", imagemUrl: "imagens/paganiRosa-removebg-preview.png" },
    { modelo: "Mercedes-Benz Actros", ano: "2022", destaque: "Força para o trabalho", imagemUrl: "imagens/caminhão-removebg-preview.png" },
    { modelo: "Kawasaki Ninja", ano: "2024", destaque: "Velocidade em duas rodas", imagemUrl: "imagens/kawasaki-Photoroom.png" }
]));
app.get('/api/garagem/servicos-oferecidos', (req, res) => res.json(servicosOferecidos));
app.get('/api/dicas-manutencao/:tipo?', (req, res) => res.json(dicasPorTipo[req.params.tipo?.toLowerCase()] || dicasGerais));
app.get('/clima', async (req, res) => {
    const cidade = req.query.cidade;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return res.status(500).json({ message: "Configuração do servidor incorreta." });
    if (!cidade) return res.status(400).json({ message: "O nome da cidade é obrigatório." });
    const cidadeQuery = cidade.includes(',') ? cidade : `${cidade},BR`;
    const url = `http://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidadeQuery)}&appid=${apiKey}&units=metric&lang=pt_br`;
    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = status === 404 ? "Cidade não encontrada." : "Erro ao buscar dados do clima.";
        res.status(status).json({ message });
    }
});

// ==========================================================
// === SERVIR ARQUIVOS ESTÁTICOS ===
// ==========================================================
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => console.log(`✅ Servidor da GARAGEM INTERATIVA rodando na porta ${PORT}`));
};

startServer();