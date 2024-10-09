const { Configuration, OpenAIApi } = require('openai');
const { API_KEY_AI } = require('./config');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://wa-bot-gpt-default-rtdb.asia-southeast1.firebasedatabase.app/' // Ganti dengan URL database Firebase Anda
});

// Referensi ke Realtime Database
const db = admin.database();

// OpenAi Config 
const configuration = new Configuration({
  apiKey: API_KEY_AI,
});
const openai = new OpenAIApi(configuration);

// message = [
//   { "role": "user", "content": "Pertanyaan pengguna pertama." },
//   { "role": "assistant", "content": "Jawaban dari asisten untuk pertanyaan pertama." },
//   { "role": "user", "content": "Pertanyaan pengguna kedua." },
//   { "role": "assistant", "content": "Jawaban dari asisten untuk pertanyaan kedua." }
// ];
uuid = '6285333341196';
user = '6285333341196';
message = "apa itu buku?";

proccessData(uuid, user, message)

async function proccessData(uuid, user, message) {
  try {
    const dateTime = new Date().toISOString().replace(/[-T:.Z]/g, '');
    var dataMessages = [];
    var target = 'messages/' + uuid + '/' + dateTime;

    // set data training
    db.ref(target + '_user' + uuid).set({
      role: 'user' + user,
      content: message
    });

    // get sys training
    const sys = db.ref('system/');
    const snapshotSys = await sys.once('value');
    const dataSys = snapshotSys.val();
    dataMessages.push(dataSys);

    // get msg training
    const msg = db.ref('messages/' + uuid);
    const snapshotMsg = await msg.once('value');
    snapshotMsg.forEach((childSnapshotMsg) => {
      const data = childSnapshotMsg.val();
      dataMessages.push(data);
    });

    const messagesTraining = {
      "messages": dataMessages
    };

    // send to openAI
    await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: JSON.stringify(messagesTraining),
      temperature: 0.3,
      max_tokens: 3000,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    }).then(response => {
      // set data reply
      db.ref(target + '_xlayla142828').set({
        role: 'Layla',
        content: response.data.choices[0].text
      });
      console.log(response.data.choices[0].text);
    });


    return dataMessages;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

var target = 'messages/' + uuid;
const ref = db.ref(target);

// var newTarget = target + '/' + dateTime + '_user_' + uuid;
// db.ref(newTarget).set({
//   role: 'user' + uuid,
//   content: message
// });

// ref.once('value', (snapshot) => {
//   const data = snapshot.val();
//   // if (!data) {
//   //   // res = ref.set({ message });
//   // } else {
//   //   newData = data.message + ' ' + message;
//   //   res = ref.update({ message: newData });
//   // }
//   // console.log(data);
// });

// const dateTime = new Date().toISOString().replace(/[-T:.Z]/g, '');
// console.log(dateTime);