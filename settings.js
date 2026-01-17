const settings = {
  sessionName: 'session',
  session: process.env.SESSION || '404-XMD;;;bth0wBDC#4QcmzpBKKeL1XGANe2K4qIYqjK5WfReuzv7Z2HFZk-Q',
  autobio: process.env.AUTOBIO || 'FALSE',
  port: process.env.PORT || 10000,
  mycode: process.env.CODE || '254',
  antiforeign: process.env.ANTIFOREIGN || 'TRUE',
  packname: process.env.STICKER_PACKNAME || '404-XMD',
  
  // 404-XMD variables
  PREFIX: '.',
  author: 'NUCH',
  botName: "404 XMD",
  botOwner: 'nuch',
  ownerNumber: '254769769295',
  giphyApiKey: 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode: "public",
  maxStoreMessages: 20,
  storeWriteInterval: 10000,
  description: "This is a bot for managing group and private chats.",
  version: "1.2",
  updateZipUrl: "https://github.com/404unkown/404-XMD/archive/refs/heads/main.zip",
  AUTO_STICKER: 'false',
  AUTO_RECORDING: 'false'
};

module.exports = settings;