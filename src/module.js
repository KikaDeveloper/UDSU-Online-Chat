exports.getUserFromDB = async function getUserFromDB(dbClient, config, login) {
  let result = await dbClient
    .db(config.db.dbname)
    .collection(config.db.users)
    .findOne({ login: login });
  return result;
};

exports.getChatFromDB = async function getChatFromDB(dbClient, config) {
  let chat = await dbClient
    .db(config.db.dbname)
    .collection(config.db.chat)
    .find()
    .toArray();
  return chat;
};

exports.addMessageOnDB = async function addMessageOnDB(
  dbClient,
  config,
  message
) {
  await dbClient
    .db(config.db.dbname)
    .collection(config.db.chat)
    .insertOne(message);
};

exports.addMessageListOnDB = async function addMessageListOnDB(
  dbClient,
  config,
  list
) {
  await dbClient
    .db(config.db.dbname)
    .collection(config.db.chat)
    .insertMany(list);
};

exports.updateUserData = async function updateUserData(
  dbClient,
  config,
  login,
  data
) {
  await dbClient
    .db(config.db.dbname)
    .collection(config.db.users)
    .findOneAndUpdate({ login: login }, { $set: { isActive: data } });
};

exports.addNewUserInDB = async function addNewUserInDB(dbClient, config, user) {
  await dbClient
    .db(config.db.dbname)
    .collection(config.db.users)
    .insertOne(user);
};

exports.dropUserState = async function dropUserState(dbClient, config) {
  await dbClient
    .db(config.db.dbname)
    .collection(config.db.users)
    .updateMany({ isActive: true }, { $set: { isActive: false } });
};

exports.sendChat = function sendChat(socket, chat){
  if (chat != null && chat.length > 0) {
    socket.emit("sendСhat", JSON.stringify(chat));
  }
}