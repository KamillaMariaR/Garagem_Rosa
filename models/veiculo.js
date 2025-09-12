// models/veiculo.js

const mongoose = require('mongoose');

const veiculoSchema = new mongoose.Schema({
    placa: {
        type: String,
        required: [true, 'A placa é obrigatória.'],
        unique: true, // Garante que não hajam duas placas iguais
        trim: true,
        uppercase: true,
        // Validação simples para o formato Mercosul ou antigo
        match: [/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, 'Formato de placa inválido.'] 
    },
    marca: {
        type: String,
        required: [true, 'A marca é obrigatória.'],
        trim: true
    },
    modelo: {
        type: String,
        required: [true, 'O modelo é obrigatório.'],
        trim: true
    },
    ano: {
        type: Number,
        required: [true, 'O ano é obrigatório.'],
        min: [1900, 'O ano parece ser muito antigo.'],
        max: [new Date().getFullYear() + 1, 'O ano não pode ser no futuro.']
    },
    cor: {
        type: String,
        trim: true,
        default: 'Não informada'
    }
}, {
    timestamps: true // Adiciona createdAt e updatedAt
});

const Veiculo = mongoose.model('Veiculo', veiculoSchema);

module.exports = Veiculo;