import { useContext, useEffect } from "react"
import socket from "./socket"
import toast, { Toaster } from "react-hot-toast"
import ScrollToBottom from "react-scroll-to-bottom"
import { SOCKET_EVENTS, ROOT_CSS } from "./utils"
import { AppContext } from "./context"


function App() {
  const { 
    username,
    connected,
    message, 
    setMessages,
    users, setUsers,
    setTyping,
    selectedUser
  } = useContext(AppContext)

  /**  USER_JOINED | MESSSAGE */
  useEffect(() => {
    socket.on(SOCKET_EVENTS.USER_JOINED, (msg) => {
      onUserJoined(msg)
    })

    socket.on(SOCKET_EVENTS.MESSSAGE, (data) => {
      onMessage(data)
    })

    return () => {
      socket.off(SOCKET_EVENTS.USER_JOINED)
      socket.off(SOCKET_EVENTS.MESSSAGE)
    }
  }, [])


  /**  USERS | USER_CONNECTED | USERNAME_TAKEN */
  useEffect(() => {
    socket.on(SOCKET_EVENTS.USERS, (users) => {
      onUsers(users)
    })

    socket.on(SOCKET_EVENTS.USER_CONNECTED, (user) => {
      onUserConnected(user)
    })

    socket.on(SOCKET_EVENTS.USERNAME_TAKEN, () => {
      onUsernameTaken()
    })

    return () => {
      socket.off(SOCKET_EVENTS.USERS)
      socket.off(SOCKET_EVENTS.USER_CONNECTED)
      socket.off(SOCKET_EVENTS.USERNAME_TAKEN)
    }
  }, [socket])


  /**  USER_DISCONNECTED */
  useEffect(() => {
    socket.on(SOCKET_EVENTS.USER_DISCONNECTED, (id) => {
      onUserDisconnected(id)
    })

    return () => {
      socket.off(SOCKET_EVENTS.USER_DISCONNECTED)
    }
  }, [users, socket])


  /**  PRIVATE_MESSAGE */
  useEffect(() => {
    socket.on(SOCKET_EVENTS.PRIVATE_MESSAGE, ({ message, from }) => {
      onPrivateMessage(message, from)
    })

    return () => {
      socket.off(SOCKET_EVENTS.PRIVATE_MESSAGE)
    }
  }, [users])


  /**  TYPING */
  useEffect(() => {
    socket.on(SOCKET_EVENTS.TYPING, (data) => {
      onTyping(data)
    })

    return () => {
      socket.off(SOCKET_EVENTS.TYPING)
    }
  }, [])


  if (message) {
    socket.emit(SOCKET_EVENTS.TYPING, username)
  }

  /** FUNCTIONS */

  const onUserJoined = (msg) => {
    console.log("user joined message", msg)
  }

  const onMessage = (data) => {
    const newMessage = {
      id: data.id,
      name: data.name,
      message: data.message,
    }

    setMessages((previousMessages) => [...previousMessages, newMessage ])
  }

  const onPrivateMessage = (message, from) => {
    const allUsers = users
    let index = allUsers.findIndex((u) => u.userID === from)
    let foundUser = allUsers[index]

    if (foundUser) {
      foundUser.messages.push({ message, fromSelf: false })
      foundUser.hasNewMessages = true
      allUsers[index] = foundUser
      setUsers([...allUsers])
    }
  }

  const onTyping = (data) => {
    setTyping(data)

    setTimeout(() => {
      setTyping("")
    }, 1000)
  }

  const onUserConnected  = (user) => {
    user.connected = true
    user.messages = []
    user.hasNewMessages = false
    setUsers((prevUsers) => [...prevUsers, user])

    toast.success(`${user.username} joined`)
  }

  const onUserDisconnected = (id) => {
    let allUsers = users
    let index = allUsers.findIndex((el) => el.userID === id)
    let foundUser = allUsers[index]

    foundUser.connected = false

    allUsers[index] = foundUser
    setUsers([...allUsers])
    toast.error(`${foundUser.username} left`)
  }

  const onUsers = (users) => {
    users.forEach((user) => {
      user.self = user.userID === socket.id
      user.connected = true
      user.messages = []
      user.hasNewMessages = false
    })

    // put the current user first, and sort by username
    const sorted = users.sort((a, b) => {
      if (a.self) return -1
      if (b.self) return 1
      if (a.username < b.username) return -1
      return a.username > b.username ? 1 : 0
    })

    setUsers(sorted)
  }

  const onUsernameTaken = () => {
    toast.error("Username taken")
  }


  return (
    <div className="container-fluid">
      <Toaster />
      
      {!connected && (
        <Login />
      )}

      <div className="row">
        <div className="col-md-2 pt-3">
          {connected &&
            users.map((user) => (
              <User user={user} />
            ))}
        </div>

        {connected && (
          <InputPublicMessage />
        )}

        <br />

        {selectedUser && (
          <InputPrivateMessage />
        )}

        <br />
      </div>
    </div>
  )
}

export default App
 
const Header = () => {
  return (
    <div className="row bg-primary text-center">
      <h1 className="fw-bold pt-2 text-light">
        MERN-STACK REALTIME CHAT APP
      </h1>
      <br />
      <p className="lead text-light">⚡ Public and private chat ⚡</p>
    </div>
  )
}

const Login = () => {
  const { 
    username, setUsername,
    setConnected,
  } = useContext(AppContext)

  const handleUsername = (e) => {
    e.preventDefault()
    socket.auth = { username }
    socket.connect()
    console.log(socket)

    setTimeout(() => {
      if (socket.connected) {
        console.log("socket.connected", socket)
        setConnected(true)
      }
    }, 1000)
  }

  return (
    <div className="row">
      <form onSubmit={handleUsername} className="text-center pt-3">
        <div className="row g-3">
          <div className="col-md-8">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              placeholder="Enter your name"
              className="form-control"
            />
          </div>

          <div className="col-md-4">
            <button className="btn btn-secondary" type="submit">
              Join
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

const InputPublicMessage = () => {
  const { 
    username,
    message, setMessage,
    messages,
    typing
  } = useContext(AppContext)

  const handleMessage = (e) => {
    e.preventDefault()

    const newMessage = {
      id: Date.now(),
      name: username,
      message,
    }

    socket.emit(SOCKET_EVENTS.MESSSAGE, newMessage)
    setMessage("")
  }

  return (
     <div className="col-md-5">
      <form onSubmit={handleMessage} className="text-center pt-3">
        <div className="row g-3">
          <div className="col-10">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              type="text"
              placeholder="Type your message (public)"
              className="form-control"
            />
          </div>

          <div className="col-2">
            <button className="btn btn-secondary" type="submit">
              Send
            </button>
          </div>
        </div>
      </form>

      <br />

      <div className="col">
        <ScrollToBottom className={ROOT_CSS}>
          {messages.map((m) => (
            <div className="alert alert-secondary" key={m.id}>
              {m.name.charAt(0).toUpperCase() + m.name.slice(1)} -{" "}
              {m.message}
            </div>
          ))}
        </ScrollToBottom>
        <br />
        {typing && typing}
      </div>
    </div>
  )
}

const InputPrivateMessage = () => {
  const { 
    selectedUser, setSelectedUser,
    privateMessage, setPrivateMessage,
    typing,
  } = useContext(AppContext)

  const handlePrivateMessage = (e) => {
    e.preventDefault()

    if (selectedUser) {

      const newMessageToEmit = {
        message: privateMessage,
        to: selectedUser.userID,
      }

      socket.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, newMessageToEmit)

      let updatedUser = selectedUser

      const newMessageToUser = {
        message: privateMessage,
        fromSelf: true,
        hasNewMessages: false,
      }

      updatedUser.messages.push(newMessageToUser)

      setSelectedUser(updatedUser)
      setPrivateMessage("")
    }
  }

  return (
    <div className="col-md-5">
      <form onSubmit={handlePrivateMessage} className="text-center pt-3">
        <div className="row g-3">
          <div className="col-10">
            <input
              value={privateMessage}
              onChange={(e) => setPrivateMessage(e.target.value)}
              type="text"
              placeholder="Type your message (private)"
              className="form-control"
            />
          </div>

          <div className="col-2">
            <button className="btn btn-secondary" type="submit">
              Send
            </button>
          </div>
        </div>
      </form>

      <br />

      <div className="col">
        <ScrollToBottom className={ROOT_CSS}>
          {selectedUser &&
            selectedUser.messages &&
            selectedUser.messages.map((msg, index) => (
              <div key={index} className="alert alert-secondary">
                {msg.fromSelf
                  ? "(yourself)"
                  : selectedUser.username.charAt(0).toUpperCase() +
                    selectedUser.username.slice(1)}{" "}
                {" - "}
                {msg.message}
              </div>
            ))}
        </ScrollToBottom>
        <br />
        {typing && typing}
      </div>
    </div>
  )
}

const User = ({ user }) => {
  const { 
    users, setUsers,
    selectedUser, setSelectedUser,
  } = useContext(AppContext)

  const handleUsernameClick = (user) => {
    if (user.self || !user.connected) return
    setSelectedUser({ ...user, hasNewMessages: false })

    let allUsers = users
    let index = allUsers.findIndex((u) => u.userID === user.userID)
    let foundUser = allUsers[index]
    foundUser.hasNewMessages = false

    allUsers[index] = foundUser
    setUsers([...allUsers])
  }

  return (
    <div
      key={user.userID}
      onClick={() => handleUsernameClick(user)}
      style={{
        textDecoration:
          selectedUser?.userID === user.userID && "underline",
        cursor: !user.self && "pointer",
      }}
    >
      {user.username.charAt(0).toUpperCase() + user.username.slice(1)}{" "}
      {user.self && "(yourself)"}{" "}
      {user.connected ? (
        <span className="online-dot"></span>
      ) : (
        <span className="offline-dot"></span>
      )}
      {user.hasNewMessages && <b className="text-danger">_ _ _</b>}
      {user.hasNewMessages && (
        <b className="text-danger">
          {user.hasNewMessages && user.messages.length}
        </b>
      )}
    </div>
  )
}
