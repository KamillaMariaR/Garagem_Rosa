// server.js (Versão Final com AUTENTICAÇÃO e PERMISSÃO PARA IMAGENS DO CLIMA)

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

// Models e Middleware
const Veiculo = require('./models/veiculo.js');
const Manutencao = require('./models/Manutencao.js');
const User = require('./models/User.js');
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
        // <-- CORRIGIDO: Adicionada permissão para carregar imagens do OpenWeatherMap
        "img-src": ["'self'", "data:", "https://openweathermap.org"],
      },
    },
  })
);

app.use(cors());
app.use(express.json()); // Middleware para parsear JSON

// Limitadores de requisição
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Muitas requisições enviadas deste IP, por favor, tente novamente mais tarde.'
});
app.use(limiter);

const createVehicleLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Você atingiu o limite de criação de veículos. Tente novamente mais tarde.',
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15, 
    message: 'Muitas tentativas de autenticação. Tente novamente mais tarde.',
});

// --- CONEXÃO COM O BANCO DE DADOS ---
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error("ERRO FATAL: Variável MONGO_URI não definida! Verifique seu .env");
            process.exit(1);
        }
        if (!process.env.JWT_SECRET) {
            console.error("ERRO FATAL: Variável JWT_SECRET não definida! Verifique seu .env");
            process.exit(1);
        }
        await mongoose.connect(mongoUri);
        console.log("🚀 Conectado ao MongoDB Atlas!");
    } catch (err) {
        console.error("❌ ERRO FATAL ao conectar ao MongoDB:", err.message);
        process.exit(1);
    }
};

// ==========================================================
// === DEFINIÇÃO DAS ROTAS DA API (ANTES DOS ARQUIVOS ESTÁTICOS) ===
// ==========================================================

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        }
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'Usuário com este e-mail já existe.' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user = new User({ email, password: hashedPassword });
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
        if (!email || !password) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Credenciais inválidas.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
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
        if (e.code === 11000) {
            return res.status(400).json({ error: 'Você já possui um veículo com esta placa.' });
        }
        res.status(400).json({ error: e.message });
    }
});

app.get('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const v = await Veiculo.find({ owner: req.userId }).sort({ createdAt: -1 });
        res.json(v);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const { marca, modelo, ano, cor, placa } = req.body;
        const dadosParaAtualizar = { marca, modelo, ano, cor, placa };
        const veiculo = await Veiculo.findById(req.params.id);
        if (!veiculo) {
            return res.status(404).json({ error: 'Veículo não encontrado.' });
        }
        if (veiculo.owner.toString() !== req.userId) {
            return res.status(403).json({ error: 'Acesso negado. Você não é o proprietário deste veículo.' });
        }
        const v = await Veiculo.findByIdAndUpdate(req.params.id, dadosParaAtualizar, { new: true, runValidators: true });
        res.json(v);
    } catch (e) {
        if (e.code === 11000) {
            return res.status(400).json({ error: 'Você já possui um veículo com esta placa.' });
        }
        res.status(400).json({ error: e.message });
    }
});

app.delete('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findById(req.params.id);
        if (!veiculo) {
            return res.status(404).json({ error: 'Veículo não encontrado.' });
        }
        if (veiculo.owner.toString() !== req.userId) {
            return res.status(403).json({ error: 'Acesso negado. Você não é o proprietário deste veículo.' });
        }
        await Manutencao.deleteMany({ veiculo: req.params.id });
        await Veiculo.findByIdAndDelete(req.params.id);
        res.json({ message: 'Veículo deletado!' });
    } catch (e) {
        res.status(500).json({ error: e.message });
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

app.get('/api/veiculos/:veiculoId/manutencoes', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findById(req.params.veiculoId);
        if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado.' });
        if (veiculo.owner.toString() !== req.userId) return res.status(403).json({ error: 'Acesso negado.' });
        const m = await Manutencao.find({ veiculo: req.params.veiculoId }).sort({ data: -1 });
        res.json(m);
    } catch (e) {
        res.status(500).json({ error: e.message });
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
// === SERVIR ARQUIVOS ESTÁTICOS (DEVE VIR DEPOIS DAS ROTAS DA API) ===
// ==========================================================
app.use(express.static(path.join(__dirname, 'public')));

// Rota Curinga: Se nenhuma rota da API correspondeu, envia o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => console.log(`✅ Servidor da GARAGEM INTERATIVA rodando na porta ${PORT}`));
};

startServer();
