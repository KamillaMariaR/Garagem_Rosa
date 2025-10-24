// server.js (VERSÃO FINAL REVISADA - GARANTIDO SEM ERROS DE SINTAXE)

// ==========================================================
// === MÓDULOS E CONFIGURAÇÃO INICIAL ===
// ==========================================================
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Imports de autenticação
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Models e Middleware
const User = require('./models/User.js');
const Veiculo = require('./models/veiculo.js');
const Manutencao = require('./models/Manutencao.js');
const authMiddleware = require('./middleware/auth.js');

const app = express();
const PORT = process.env.PORT || 3001;

// ==========================================================
// === MIDDLEWARES GERAIS E SEGURANÇA ===
// ==========================================================
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
app.use(cors({
    origin: '*', // Permite qualquer origem (apenas para desenvolvimento)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// Limitadores de requisição
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use(limiter);
const createVehicleLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'Você atingiu o limite de criação de veículos.' });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: 'Muitas tentativas de autenticação.' });

// ==========================================================
// === CONEXÃO COM O BANCO DE DADOS ===
// ==========================================================
const connectDB = async () => {
    try {
        console.log("Tentando conectar ao MongoDB...");
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error("ERRO FATAL: Variável MONGO_URI não definida no arquivo .env!");
        if (!process.env.JWT_SECRET) throw new Error("ERRO FATAL: Variável JWT_SECRET não definida no arquivo .env!");
        
        await mongoose.connect(mongoUri);
        console.log("🚀 Conectado ao MongoDB Atlas com sucesso!");
    } catch (err) {
        console.error("❌ ERRO FATAL AO CONECTAR AO MONGODB:", err.message);
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
        if (!email || !password) return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
        if (await User.findOne({ email })) return res.status(400).json({ message: 'Usuário com este e-mail já existe.' });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = new User({ email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (e) {
        console.error("Erro no registro:", e.message);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }
        const payload = { userId: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token, email: user.email, userId: user.id });
    } catch (e) {
        console.error("Erro no login:", e.message);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// --- ROTAS DE VEÍCULOS (PROTEGIDAS) ---
app.post('/api/veiculos', authMiddleware, createVehicleLimiter, async (req, res) => {
    try {
        const v = await Veiculo.create({ ...req.body, owner: req.userId });
        res.status(201).json(v);
    } catch (e) {
        if (e.code === 11000) return res.status(400).json({ message: 'Você já possui um veículo com esta placa.' });
        res.status(400).json({ message: e.message });
    }
});

app.get('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const veiculos = await Veiculo.find({
            $or: [{ owner: req.userId }, { sharedWith: req.userId }]
        })
        .populate('owner', 'email _id')
        .populate('sharedWith', 'email _id')
        .sort({ createdAt: -1 });
        res.json(veiculos);
    } catch (e) {
        console.error("Erro ao listar veículos:", e.message);
        res.status(500).json({ message: e.message });
    }
});

app.put('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findById(req.params.id);
        if (!veiculo) return res.status(404).json({ message: 'Veículo não encontrado.' });
        if (veiculo.owner.toString() !== req.userId) return res.status(403).json({ message: 'Acesso negado.' });
        const v = await Veiculo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json(v);
    } catch (e) {
        if (e.code === 11000) return res.status(400).json({ message: 'Você já possui um veículo com esta placa.' });
        res.status(400).json({ message: e.message });
    }
});

app.delete('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findById(req.params.id);
        if (!veiculo) return res.status(404).json({ message: 'Veículo não encontrado.' });
        if (veiculo.owner.toString() !== req.userId) return res.status(403).json({ message: 'Acesso negado.' });
        await Manutencao.deleteMany({ veiculo: req.params.id });
        await Veiculo.findByIdAndDelete(req.params.id);
        res.json({ message: 'Veículo deletado com sucesso!' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.post('/api/veiculos/:veiculoId/share', authMiddleware, async (req, res) => {
    try {
        const { email } = req.body;
        const { veiculoId } = req.params;
        const veiculo = await Veiculo.findById(veiculoId);
        if (!veiculo) return res.status(404).json({ message: 'Veículo não encontrado.' });
        if (veiculo.owner.toString() !== req.userId) return res.status(403).json({ message: 'Acesso negado. Você não é o proprietário.' });
        const userToShareWith = await User.findOne({ email });
        if (!userToShareWith) return res.status(404).json({ message: `Usuário com o e-mail "${email}" não encontrado.` });
        if (userToShareWith.id === req.userId) return res.status(400).json({ message: 'Você não pode compartilhar um veículo com você mesmo.' });
        if (veiculo.sharedWith.includes(userToShareWith.id)) return res.status(400).json({ message: `Este veículo já está compartilhado com ${email}.` });
        veiculo.sharedWith.push(userToShareWith.id);
        await veiculo.save();
        res.status(200).json({ message: `Veículo compartilhado com sucesso com ${email}!` });
    } catch (e) {
        console.error("Erro ao compartilhar veículo:", e.message);
        res.status(500).json({ message: 'Erro no servidor ao tentar compartilhar.' });
    }
});

app.post('/api/veiculos/:veiculoId/unshare', authMiddleware, async (req, res) => {
    try {
        const { userIdToRemove } = req.body;
        const { veiculoId } = req.params;
        if (!userIdToRemove) return res.status(400).json({ message: 'ID do usuário a ser removido é obrigatório.' });
        const veiculo = await Veiculo.findById(veiculoId);
        if (!veiculo) return res.status(404).json({ message: 'Veículo não encontrado.' });
        if (veiculo.owner.toString() !== req.userId) return res.status(403).json({ message: 'Acesso negado. Apenas o proprietário pode remover compartilhamentos.' });
        
        await Veiculo.updateOne({ _id: veiculoId }, { $pull: { sharedWith: userIdToRemove } });
        res.status(200).json({ message: 'Compartilhamento removido com sucesso!' });
    } catch (e) {
        console.error("Erro ao remover compartilhamento:", e.message);
        res.status(500).json({ message: 'Erro no servidor ao tentar remover compartilhamento.' });
    }
});

// --- ROTAS DE MANUTENÇÃO (PROTEGIDAS) ---
app.post('/api/veiculos/:veiculoId/manutencoes', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findById(req.params.veiculoId);
        if (!veiculo) return res.status(404).json({ message: 'Veículo não encontrado.' });
        const isOwner = veiculo.owner.toString() === req.userId;
        const isSharedWith = veiculo.sharedWith.map(id => id.toString()).includes(req.userId);
        if (!isOwner && !isSharedWith) return res.status(403).json({ message: 'Acesso negado para adicionar manutenção.' });
        
        const m = await Manutencao.create({ ...req.body, veiculo: req.params.veiculoId });
        res.status(201).json(m);
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
});

app.get('/api/veiculos/:veiculoId/manutencoes', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findById(req.params.veiculoId);
        if (!veiculo) return res.status(404).json({ message: 'Veículo não encontrado.' });
        const isOwner = veiculo.owner.toString() === req.userId;
        const isSharedWith = veiculo.sharedWith.map(id => id.toString()).includes(req.userId);
        if (!isOwner && !isSharedWith) return res.status(403).json({ message: 'Acesso negado para ver manutenções.' });
        
        const manutencoes = await Manutencao.find({ veiculo: req.params.veiculoId }).sort({ data: -1 });
        res.json(manutencoes);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// --- ROTAS PÚBLICAS (INFORMAÇÕES GERAIS) ---
const servicosOferecidos = [ { nome: "Troca de Óleo e Filtro", descricao: "Serviço completo.", precoEstimado: "R$ 250,00" }, { nome: "Alinhamento e Balanceamento", descricao: "Direção mais segura.", precoEstimado: "R$ 150,00" }, ];
const dicasGerais = [{ dica: "Verifique a calibragem dos pneus semanalmente." }, { dica: "Troque o óleo no prazo." }];
const dicasPorTipo = { carro: [{ dica: "Faça o rodízio dos pneus a cada 10.000 km." }], moto: [{ dica: "Lubrifique a corrente regularmente." }], };
app.get('/api/garagem/veiculos-destaque', (req, res) => res.json([ { modelo: "Honda Civic", ano: "2021", destaque: "O carro confiável", imagemUrl: "imagens/civic-removebg-preview.png" }, { modelo: "Pagani Huayra", ano: "2023", destaque: "A pura esportividade", imagemUrl: "imagens/paganiRosa-removebg-preview.png" }, { modelo: "Mercedes-Benz Actros", ano: "2022", destaque: "Força para o trabalho", imagemUrl: "imagens/caminhão-removebg-preview.png" }, { modelo: "Kawasaki Ninja", ano: "2024", destaque: "Velocidade em duas rodas", imagemUrl: "imagens/kawasaki-Photoroom.png" } ]));
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
// === SERVIR ARQUIVOS DO FRONTEND E INICIAR SERVIDOR ===
// ==========================================================
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Função de Inicialização do Servidor ---
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => console.log(`✅ Servidor da GARAGEM INTERATIVA rodando na porta ${PORT}`));
};

startServer();