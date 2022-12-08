import { SOCKET_EVENTS } from "../utils";

const addUser = (io, users) => {
  for (let [id, socket] of io.of("/").sockets) {
    const existingUser = users.find((u) => u.username === socket.username);
    if (existingUser) {
      socket.emit(SOCKET_EVENTS.USERNAME_TAKEN);
      socket.disconnect();
      return;
    } else {
      users.push({
        userID: id,
        username: socket.username,
      });
    }
  }
}

const chat = (io) => {
  io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    if (!username) {
      return next(new Error("invalid username"));
    }
    socket.username = username;
    next();
  });

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    let users = [];
    addUser(io, users)

    socket.emit(SOCKET_EVENTS.USERS, users);

    // when a new user joins, nofity existing users
    socket.broadcast.emit(SOCKET_EVENTS.USER_CONNECTED, {
      userID: socket.id,
      username: socket.username,
    });

    socket.on(SOCKET_EVENTS.MESSSAGE, (data) => {
      io.emit(SOCKET_EVENTS.MESSSAGE, data);
    });

    socket.on(SOCKET_EVENTS.TYPING, (username) => {
      socket.broadcast.emit(SOCKET_EVENTS.TYPING, `${username} is typing...`);
    });

    socket.on(SOCKET_EVENTS.PRIVATE_MESSAGE, ({ message, to }) => {
      socket.to(to).emit(SOCKET_EVENTS.PRIVATE_MESSAGE, {
        message,
        from: socket.id,
      });
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      socket.broadcast.emit(SOCKET_EVENTS.USER_DISCONNECTED, socket.id);
    });
  });
};

export default chat;
