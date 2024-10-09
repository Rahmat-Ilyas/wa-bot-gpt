const { Configuration, OpenAIApi } = require('openai');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { API_KEY_AI } = require('./config');

const configuration = new Configuration({
	apiKey: API_KEY_AI,
});
const openai = new OpenAIApi(configuration);

const client = new Client({
	puppeteer: { args: ["--no-sandbox"] },
	authStrategy: new LocalAuth(),
});

// const client = new Client({ puppeteer: { headless: true, args: ['--no-sandbox'] } });

// firebase 
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://wa-bot-gpt-default-rtdb.asia-southeast1.firebasedatabase.app/'
});

client.on('qr', (qr) => {
	qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
	console.log('Client is ready!');
});

client.on('message', async (msg) => {
	const text = msg.body.toLowerCase() || '';
	console.log(msg.from + ': ' + text);

	// check pesan
	if (text.substring(0, 4) == '!gpt' || text.substring(0, 1) == '?') {
		// Kirim pesan ke OpenAi dan dapatkan balasan
		var textfix;
		if (text.substring(0, 4) == '!gpt') textfix = text.substring(4, text.length);
		else if (text.substring(0, 1) == '?') textfix = text.substring(1, text.length);

		// Referensi ke Realtime Database
		const db = admin.database();
		let uuid = msg.from.replace(/@c\.us$/, '');
		let message = textfix;
		const ref = db.ref('messages/' + uuid);
		var prompt;

		ref.once('value', (snapshot) => {
			const data = snapshot.val();
			if (!data) {
				res = ref.set({ message: 'Saaya: ' + message });
			} else {
				newData = data.message + ' Saaya: ' + message;
				res = ref.update({ message: newData });
			}
			prompt = data.message;
		});

		const response = await openai.createCompletion({
			model: 'text-davinci-003',
			prompt: prompt,
			temperature: 0.5,
			max_tokens: 3000,
			top_p: 1.0,
			frequency_penalty: 0.0,
			presence_penalty: 0.0,
		});

		// Kirim balasan kepada pengirim pesan
		let reply = response.data.choices[0].text;

		ref.once('value', (snapshot) => {
			const data = snapshot.val();
			console.log(data.message);
			newData = data.message + ' Bot: ' + reply;
			ref.update({ message: newData });
		});

		msg.reply(reply);
	} else if (text.substring(0, 4) == '!img') {
		const response = await openai.createImage({
			prompt: text.substring(4, text.length),
			n: 1,
			size: "1024x1024",
		});
		image_url = response.data.data[0].url;
		const media = await MessageMedia.fromUrl(image_url);
		// const sendMessageData = await client.sendMessage(media, text.substring(4, text.length));
		msg.reply(media);
	}
});

client.initialize();