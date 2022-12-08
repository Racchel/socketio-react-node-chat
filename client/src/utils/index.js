import { css } from "@emotion/css"

export const SOCKET_EVENTS = {
  USER_JOINED: "user joined",
  MESSSAGE: "message",
  USER_CONNECTED: "user connected",
  USERS: "users",
  USERNAME_TAKEN: "username taken",
  USER_DISCONNECTED: "user disconnected",
  TYPING: "typing",
  PRIVATE_MESSAGE: "private message"
}

export const ROOT_CSS = css({
  height: 650,
  width: "100%",
})