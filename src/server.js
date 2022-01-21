const htttp = require("http");
const express = require("express");
let func_module = require("./module.js");

// -------------------EXPRESS------------------
app = express();
app.set("views", __dirname + "/views");
app.set("view engine", "pug");
app.set("view option", { layout: false });
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.render("index.pug");
});
//кол-во пользователей
let online = 0;
//прикрепить express app к серверу
const server = htttp.createServer(app);

// ------------------SOCKET.IO---------------
const io = require("socket.io")(server);
const config = require("./config.json");
const states = require("./states.json");
const { MongoClient } = require("mongodb");

client = new MongoClient(config.db.url, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

client.connect(async (err) => {
  if (err) throw err;
  else console.log("Database connected.");

  //сбрасываем state isActive
  await func_module.dropUserState(client, config);
  console.log("Users states 'isActive' droped.");

  //включаем прослушку порта
  server.listen(config.port);
  console.log("Server has been started on PORT: " + config.port);
});

async function checkUser(user) {
  let tUser = await func_module.getUserFromDB(client, config, user.login);
  //проверка на существование пользователя в БД
  if (tUser != null) {
    //проверка соответствия пароля
    if (user.password == tUser.password) {
      //проверка пользователя на активность
      if (!tUser.isActive) {
        //разрешить пользователю доступ к чату
        return states.st1;
      } else {
        //запретить пользователю доступ к чату
        return states.st2;
      }
    } else {
      //сообщить пользователю что пароль неправильный
      return states.st3;
    }
  } else {
    //функция добавления в БД
    return states.st4;
  }
}

// ----------------CONNECTION---------
io.on("connection", (socket) => {
  console.log("Connection...");

  let isAuthtorizate = false;
  let user;

  //регистрация клиента
  socket.on("authorization", async (data) => {
    user = data;
    let state = await checkUser(data);

    if (state == states.st1) {
      //успешно вошли и подключились
      await func_module.updateUserData(client, config, user.login, true);
      socket.emit(states.st1);
      //рассылка уже имеющихся сообщений при новом подключении
      let chat = await func_module.getChatFromDB(client, config);
      func_module.sendChat(socket, chat);
      //отправка онлайна
      online++;
      isAuthtorizate = true;
    } else if (state == states.st2) {
      //попытка войти в в подключеный логин
      socket.emit(states.st2);
      isAuthtorizate = false;
    } else if (state == states.st3) {
      //неправильный пароль
      socket.emit(states.st3);
      isAuthtorizate = false;
    } else if (state == states.st4) {
      //добавили нового пользователя
      await func_module.addNewUserInDB(client, config, {
        login: data.login,
        password: data.password,
        isActive: true,
      });
      online++;
      isAuthtorizate = true;
      socket.emit(states.st4);

      //отправляем все сообщения
      let chat = await func_module.getChatFromDB(client, config);
      func_module.sendChat(socket, chat);
    }
  });

  //рассылка сообщения от пользователя другим
  socket.on("message", async (data) => {
    await func_module.addMessageOnDB(client, config, data);
    //рассылаем сообщения всем участникам
    socket.broadcast.emit("message", data);
  });

  socket.on("online_request", () => {
    socket.emit("online", online);
  });

  socket.on("disconnect", async () => {
    if (online > 0 && isAuthtorizate) online--;
    if (user != null)
      await func_module.updateUserData(client, config, user.login, false);
    console.log("Disconnected...");
  });
});
