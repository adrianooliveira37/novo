const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('whatsapp-web.js');

const app = express();
const client = new Client();

app.use(bodyParser.json());

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();

app.post('/enviar-mensagem', async (req, res) => {
    try {
        const { numero, mensagem } = req.body;

        if (!numero || !mensagem) {
            throw new Error('Número ou mensagem ausente na solicitação.');
        }

        const contato = await client.getContactById(numero + '@c.us');
        
        if (!contato) {
            throw new Error('Contato não encontrado.');
        }

        await client.sendMessage(contato.id._serialized, mensagem);

        res.status(200).json({ status: 'success', message: 'Mensagem enviada com sucesso.' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ status: 'error', message: 'Erro ao enviar a mensagem.' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});
