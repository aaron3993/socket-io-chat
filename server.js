const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const PORT = 8080;

const users = [];
const botName = "TeamStream"

const hostInfo = {
  videoId: null,
  time: 0,
  play: true
}

io.on("connection", socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    socket.emit('message', { id: 1, username: `TeamStreamBot`, message: 'Welcome to TeamStream!' });

    socket.broadcast
      .to(user.room)
      .emit('message', { id: 1, username: `TeamStreamBot`, message: `${user.username} has joined the chat` })




  })
  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message', { id: 1, username: `TeamStreamBot`, message: `${user.username} has left the chat` })
    }
  });

  socket.emit("your id", socket.id);
  socket.on("send message", body => {
    const user = getCurrentUser(socket.id);
    const messageObj = createMsgObj(body, user)
    io.to(user.room).emit("message", messageObj)
  })

  socket.on("videoAction", action => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("videoAction", action)
  })

  socket.on("requestVideoInfo", action => {
    //if not a host, request for video info from the host
    if (users[0].id !== socket.id) {
      socket.emit("provideVideoInfo", hostInfo)
    }else{
      setInterval(() => {
        io.to(users[0].id).emit("pingHostForInfo", "");
      }, 200)
    }
  })

  socket.on("HostInfo", info => {
    hostInfo.videoId = info.videoId
    hostInfo.time = info.time
    hostInfo.play = info.play

  })

})

function userJoin(id, username, room) {
  const user = { id, username, room };

  users.push(user);

  return user;
}

// User leaves chat
function userLeave(id) {
  const index = users.findIndex(user => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}
function getCurrentUser(id) {
  return users.find(user => user.id === id);
}

function createMsgObj(msg, user) {
  return {
    id: msg.id,
    message: msg.body,
    username: user.username
  }
}



server.listen(PORT, () => console.log("server is running on port 8080"));