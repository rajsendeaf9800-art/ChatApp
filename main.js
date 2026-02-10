/***********************
 🔥 FIREBASE IMPORTS
***********************/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  onChildRemoved,
  remove,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/***********************
 🔥 FIREBASE CONFIG 
 AIzaSyBTafY77KurCjZu7I5f-Ye-Xq_7y6Moefg
 AIzaSyBNSC3hHxlvgttBP_op0bioZ6K_VKljSGY
***********************/
const firebaseConfig = {
  apiKey: "AIzaSyBTafY77KurCjZu7I5f-Ye-Xq_7y6Moefg",
  authDomain: "chat-c54e1.firebaseapp.com",
  databaseURL: "https://chat-c54e1-default-rtdb.firebaseio.com/",
  projectId: "chat-c54e1",
  storageBucket: "chat-c54e1.firebasestorage.app",
  messagingSenderId: "125072454372",
  appId: "1:125072454372:web:e6b400c36de830498d72f1"
};

/***********************
 🌐 UI ELEMENTS
***********************/
const offlineScreen = document.getElementById("offlineScreen");
const loadingScreen = document.getElementById("loadingScreen");
const loginScreen = document.getElementById("loginScreen");
const chatScreen = document.getElementById("chatScreen");
const messagesDiv = document.getElementById("messages");

/***********************
 🖥️ SCREEN CONTROLLER
***********************/
function showScreen(screen) {
  offlineScreen.style.display = "none";
  loadingScreen.style.display = "none";
  loginScreen.style.display = "none";
  chatScreen.style.display = "none";
  screen.style.display = "flex";
}

/***********************
 🌐 OFFLINE / ONLINE FLOW
***********************/
if (!navigator.onLine) {
  showScreen(offlineScreen);
} else {
  showScreen(loadingScreen);
}

window.addEventListener("offline", () => {
  showScreen(offlineScreen);
});

window.addEventListener("online", () => {
  showScreen(loadingScreen);
  setTimeout(() => location.reload(), 500);
});

/***********************
 🔔 NOTIFICATION PERMISSION
***********************/
function requestNotificationPermission() {
  if (!("Notification" in window)) return;

  if (Notification.permission === "default") {
    Notification.requestPermission().then(p => {
      console.log("Notification permission:", p);
    });
  }
}

/***********************
 👁️ VISIBILITY TRACK
***********************/
let appHidden = document.hidden;

document.addEventListener("visibilitychange", () => {
  appHidden = document.hidden;
});

/***********************
 🚀 FIREBASE INIT (SAFE)
***********************/
let app = null;
let db = null;
let messagesRef = null;
let firebaseStarted = false;

let currentUser = localStorage.getItem("username");

function initFirebase() {
  if (firebaseStarted) return;
  firebaseStarted = true;

  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  messagesRef = ref(db, "messages");

  if (!currentUser) {
    showScreen(loginScreen);
  } else {
    showScreen(chatScreen);
    requestNotificationPermission();
    listenMessages();
  }
}

window.addEventListener("load", () => {
  if (!navigator.onLine) return;
  showScreen(loadingScreen);
  setTimeout(initFirebase, 500);
});

/***********************
 👤 LOGIN / LOGOUT
***********************/
document.getElementById("saveUsername").onclick = () => {
  const name = document.getElementById("usernameInput").value.trim();
  if (!name) return alert("Enter username");
  localStorage.setItem("username", name);
  location.reload();
};

document.getElementById("logout").onclick = () => {
  localStorage.removeItem("username");
  location.reload();
};

/***********************
 💬 SEND MESSAGE
***********************/
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

sendBtn.onclick = sendMessage;
messageInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !currentUser) return;

  push(messagesRef, {
    user: currentUser,
    text,
    time: serverTimestamp()
  });

  messageInput.value = "";
}

/***********************
 📥 RECEIVE + DELETE + NOTIFY
***********************/
let firstLoad = true;

function listenMessages() {
  onChildAdded(messagesRef, snap => {
    const msg = snap.val();
    const id = snap.key;

    const div = document.createElement("div");
    div.className = "message " + (msg.user === currentUser ? "me" : "other");
    div.id = "msg-" + id;

    div.innerHTML = `
      <div class="user">${msg.user}</div>
      <div class="text">${msg.text}</div>
    `;

    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    // 🔔 NOTIFICATION (FIXED)
    if (
      !firstLoad &&
      msg.user !== currentUser &&
      appHidden &&
      Notification.permission === "granted"
    ) {
      showNotification(msg.user, msg.text);
    }

    // 🗑️ LONG PRESS DELETE (OWN MESSAGE)
    if (msg.user === currentUser) {
      let timer;
      div.addEventListener("touchstart", () => {
        timer = setTimeout(() => {
          if (confirm("Delete message?")) {
            remove(ref(db, "messages/" + id));
          }
        }, 600);
      });
      div.addEventListener("touchend", () => clearTimeout(timer));
    }
  });

  onChildRemoved(messagesRef, snap => {
    const el = document.getElementById("msg-" + snap.key);
    if (el) el.remove();
  });

  setTimeout(() => firstLoad = false, 1500);
}

/***********************
 🔔 SHOW NOTIFICATION
***********************/
function showNotification(user, text) {
  try {
    new Notification(`💬 ${user}`, {
      body: text
    });
  } catch (e) {
    console.error("Notification error:", e);
  }
}
