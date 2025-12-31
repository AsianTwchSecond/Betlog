const mineflayer = require("mineflayer")
const express = require("express")

const app = express()
let bot = null
let logs = []
let connecting = false

function addLog(msg) {
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`
  console.log(line)
  logs.push(line)
  if (logs.length > 200) logs.shift()
}

/* ---------------- BOT CONTROL ---------------- */
function joinBot() {
  if (bot || connecting) {
    addLog("Join ignored (already online or connecting)")
    return
  }

  connecting = true
  addLog("Starting bot...")

  bot = mineflayer.createBot({
    host: "bingungsmp.top",
    username: "Xacrifizee_",
    version: false
  })

  bot.once("spawn", () => {
    connecting = false
    addLog("Bot spawned")

    setTimeout(() => bot.chat("/login <kurt>"), 3000)
    setTimeout(() => bot.chat("/server ecocpvp"), 6000)

    // Auto jump only
    bot.jumpInterval = setInterval(() => {
      bot.setControlState("jump", true)
      setTimeout(() => bot.setControlState("jump", false), 200)
    }, 5000)
  })

  bot.on("end", () => {
    addLog("Bot disconnected")
    if (bot?.jumpInterval) clearInterval(bot.jumpInterval)
    bot = null
    connecting = false
  })

  bot.on("error", err => addLog("Error: " + err.message))
}

function leaveBot() {
  if (!bot) {
    addLog("Leave ignored (bot offline)")
    return
  }
  addLog("Bot leaving server")
  if (bot.jumpInterval) clearInterval(bot.jumpInterval)
  bot.quit()
  bot = null
}

/* ---------------- WEBSITE ---------------- */
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>AFK Bot Control</title>
  <style>
    body { background:#111; color:#0f0; font-family:monospace; padding:20px }
    button { padding:10px 20px; margin-right:10px; font-size:16px }
    #logs { background:#000; padding:10px; height:300px; overflow:auto; margin-top:15px }
  </style>
</head>
<body>
  <h2>AFK Bot Control Panel</h2>

  <button onclick="fetch('/join')">JOIN</button>
  <button onclick="fetch('/leave')">LEAVE</button>

  <div id="logs"></div>

  <script>
    async function refreshLogs() {
      const res = await fetch('/logs')
      const text = await res.text()
      const box = document.getElementById('logs')
      box.textContent = text
      box.scrollTop = box.scrollHeight
    }
    setInterval(refreshLogs, 1000)
    refreshLogs()
  </script>
</body>
</html>
`)
})

app.get("/join", (req, res) => {
  joinBot()
  res.send("OK")
})

app.get("/leave", (req, res) => {
  leaveBot()
  res.send("OK")
})

app.get("/logs", (req, res) => {
  res.send(logs.join("\n"))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => addLog("Website running on port " + PORT))
