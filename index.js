require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const search = require("./search");

// replace the value below with the Telegram token you receive from @BotFather
const env = process.env;
const token = process.env.BOT_TOKEN;
  var count = 0;
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
// Bot Menu

// Matches "/echo [whatever]"
bot.onText(/\/buscar (.+)/, async (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  
// 2. Print the user country code
try {
  let chatId = msg.chat.id;

  let searchInfo = match[1];
  let searching = await bot.sendMessage(chatId, `Buscando resultados para "${searchInfo}"`);
  let result = await search.search(searchInfo);
  bot.deleteMessage(chatId, searching.message_id);
  if (msg.chat.type === 'group' ||  msg.chat.type === 'supergroup') {
    bot.sendMessage(chatId, `Te he enviado la búsqueda directamente`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Ver listado', url: `https://telegram.me/${process.env.BOT}` }]
        ]
      }
    });
    chatId = msg.from.id;
   
  }
 
  let filterMessages = result.filter(message => message.message !== '')
  
  if (filterMessages.length === 0) {
    bot.sendMessage(chatId, "No se encontraron resultados");
    return;
  }
  await bot.sendMessage(chatId, `Esto es lo que he encontrado para: "${searchInfo}"`);
  filterMessages.forEach(async message => { 
    var count = 0;
    let url = await search.getUrl(message);
    if( url === undefined ) return;
    if(!message.media) {
      message.message.replace(/[Streaming]*g\n[https:\/\/t.me\/peliculascristianasstreaming\/]*[\d]*/, '');
      await bot.sendMessage(chatId, `${message.message}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Ver Película', url: url }]
          ]
        }
      }).then().catch((err) => {
        catchAlert(err, count, msg)
      });
      return;
    }
    let bufferMedia;
    let media = await search.getFileStream(message);
    bufferMedia = await Buffer.from(media.bytes);    

    let message_new = {
      caption: message.message,
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Ver Película', url: url }]
        ]
      }
    }
    await bot.sendPhoto(chatId,bufferMedia,message_new).then().catch((err) => {
      catchAlert(err, count, msg);
    })
    
  });

} catch (err) {
}
});


function sendStartSessionWithBot(groupID) {
  bot.sendMessage({
    chat_id: groupID, 
    text: `Debes iniciar sesión en el bot antes de usarlo:`,
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Iniciar sesión', url: `https://telegram.me/${process.env.BOT}?start` }]
      ]
    }
  });
}


// Send Alert error 
function catchAlert(err, count, msg) {
  const { message } = err;
  if (count>0) return;
  if (message.search('403') !== -1) {
    count++;
    if (msg.chat.type === "group") {
      chatId = msg.chat.id;
    }
    sendStartSessionWithBot(chatId);
  }
}