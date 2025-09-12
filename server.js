// server.js (Versão Final Limpa e Garantida)

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path')
require('dotenv').config(); 

const Veiculo = require('./models/veiculo.js'); 
const Manutencao = require('./models/Manutencao.js');

const app = express();
const PORT = process.env.PORT || 3001;

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
app.post('/api/veiculos', async (req, res) => { try { const v = await Veiculo.create(req.body); res.status(201).json(v); } catch (e) { res.status(400).json({ error: e.message }); } });
app.get('/api/veiculos', async (req, res) => { try { const v = await Veiculo.find().sort({ createdAt: -1 }); res.json(v); } catch (e) { res.status(500).json({ error: e.message }); } });
app.put('/api/veiculos/:id', async (req, res) => { try { const v = await Veiculo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); res.json(v); } catch (e) { res.status(400).json({ error: e.message }); } });
app.delete('/api/veiculos/:id', async (req, res) => { try { await Manutencao.deleteMany({ veiculo: req.params.id }); await Veiculo.findByIdAndDelete(req.params.id); res.json({ message: 'Veículo deletado!' }); } catch (e) { res.status(500).json({ error: e.message }); } });

// --- ROTAS DE MANUTENÇÃO ---
app.post('/api/veiculos/:veiculoId/manutencoes', async (req, res) => { try { const m = await Manutencao.create({ ...req.body, veiculo: req.params.veiculoId }); res.status(201).json(m); } catch (e) { res.status(400).json({ error: e.message }); } });
app.get('/api/veiculos/:veiculoId/manutencoes', async (req, res) => { try { const m = await Manutencao.find({ veiculo: req.params.veiculoId }).sort({ data: -1 }); res.json(m); } catch (e) { res.status(500).json({ error: e.message }); } });

// --- ROTAS DE GARAGEM ---
app.get('/api/garagem/veiculos-destaque', (req, res) => { res.json([ { modelo: "Honda Civic", ano: "2021", destaque: "O carro confiável", imagemUrl: "imagens/civic-removebg-preview.png" }, { modelo: "Pagani Huayra", ano: "2023", destaque: "A pura esportividade", imagemUrl: "imagens/paganiRosa-removebg-preview.png" }, { modelo: "Mercedes-Benz Actros", ano: "2022", destaque: "Força para o trabalho", imagemUrl: "imagens/caminhão-removebg-preview.png" }, { modelo: "Kawasaki Ninja", ano: "2024", destaque: "Velocidade em duas rodas", imagemUrl: "imagens/kawasaki-Photoroom.png" } ]); });
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