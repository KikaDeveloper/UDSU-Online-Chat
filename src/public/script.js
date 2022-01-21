const socket = io.connect();

let login = "";
let connect = false;

// ------------FUNCTIONS-------------

//очищение чата
function clearChat() {
  $(".mess").remove();
  $(".mess .my_mess").remove();
}

function scrollDown() {
  var div = $(".message_window");
  div.scrollTop(div.prop("scrollHeight"));
}

function clearHints() {
  $(".message_field").focus(() => {
    $(".new_user").remove();
  });
}

function clearAuthHints() {
  $(".wrong_pass").remove();
  $(".new_user").remove();
  $(".error_user").remove();
}

function clearInputs() {
  //очищение полей ввода и отключение кнопки
  $(".login_input").val("");
  $(".pass_input").val("");
  $(".login_input").attr("disabled", true);
  $(".pass_input").attr("disabled", true);
  $(".auth_button").attr("disabled", true);
}

//регистрация клиента
function Authorization() {
  if ($(".login_input").val() != "" && $(".pass_input").val() != "") {
    let data = {
      login: $(".login_input").val(),
      password: $(".pass_input").val(),
    };
    login = $(".login_input").val();
    connect = true;
    socket.emit("authorization", data);
  }
}

//добавление сообщения в чат
function addMessage(data) {
  //проверка сообщений на пирнадлежность пользователю
  if (data.user == login) {
    $(".message_window").append(
      "<div class='mess my_mess'>" + data.message + "</div>"
    );
  } else {
    $(".message_window").append(
      "<div class='mess'>" +
        "<span class='user_name'>" +
        data.user +
        "</span> " +
        data.message +
        "</div>"
    );
  }
  scrollDown();
}

//отправление сообщения в чат
function sendMessage() {
  if ($(".message_field").val() != "") {
    let data = { message: $(".message_field").val(), user: login };
    socket.emit("message", data);
    addMessage(data);
    //очищаем поле ввода
    $(".message_field").val("");
  }
  scrollDown();
}

//обновление чата
function updateMessages(json) {
  clearChat();
  let result = JSON.parse(json);
  for (let i = 0; i < result.length; i++) {
    addMessage(result[i]);
  }
}

// ----------------EVENTS----------------
socket.on("message", (data) => {
  if (connect) {
    addMessage(data);
  }
});

socket.on("success", () => {
  connect = true;
  clearInputs();
  console.log("registration succesful!");
});

socket.on("sendСhat", (json) => {
  updateMessages(json);
});

socket.on("ban", () => {
  $(".auth").append(
    "<div class='error_user wrong_pass'>Такой пользователь уже вошел!</div>"
  );
});

socket.on("wrong_password", () => {
  $(".auth").append("<div class='wrong_pass'>Неправильный пароль!</div>");
});

socket.on("add_user", () => {
  $(".auth").append(
    "<div class='new_user'>Вы добавлены в список пользователей</div>"
  );
  clearInputs();
});

socket.on("online", (online) => {
  $(".online_block").remove();
  $(".online_counter").append(
    "<h4 class='online_block'>В сети: " + online + "</h4>"
  );
});

function AuthorizationClient() {
  $(".auth_button").click(() => {
    Authorization();
    clearAuthHints();
  });
}

function OnlineCounterUpdate() {
  setInterval(() => {
    socket.emit("online_request");
  }, 2500);
}

function SendMessageOnButton() {
  $(".send_button").click(function () {
    if (connect == true) sendMessage();
  });
}

function SendMessageOnEnter() {
  $(".message_field").keydown((e) => {
    if (e.keyCode == 13 && connect == true) {
      sendMessage();
    }
  });
}

$((e) => {
  //регистрация клиента
  AuthorizationClient();

  //отправка сообщения при нажатии на кнопку
  SendMessageOnButton();
  //отправка сообщения при нажатии на клавишу Enter
  SendMessageOnEnter();

  OnlineCounterUpdate();

  clearHints();
});
