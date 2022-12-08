import { createContext, useState } from "react"

export const AppContext = createContext()

export const AppContextProvider = ({children}) => {
  const [username, setUsername] = useState("")
  const [connected, setConnected] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [typing, setTyping] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [privateMessage, setPrivateMessage] = useState("")

  return (
    <AppContext.Provider value={{
      username, setUsername,
      connected, setConnected,
      message, setMessage,
      messages, setMessages,
      users, setUsers,
      typing, setTyping,
      selectedUser, setSelectedUser,
      privateMessage, setPrivateMessage,
    }}>
      {children}
    </AppContext.Provider>
  )
}