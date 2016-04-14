const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const process = require('process')
const send = require('./send')

const app = express()
const verifyToken = process.env.verifyToken

app.use(bodyParser.json())

app.get('/*', (req, res) => {
  const q = req.query
  // If the token doesn't match...
  if (q['hub.verify_token'] !== verifyToken) {
    res.sendStatus(401)
  }
  if (q['hub.mode'] === 'subscribe') {
    console.log('s', q['hub.challenge'])
    res.send(q['hub.challenge'])
  } else {
    res.send(req.headers)
  }
})

app.post('/*', (req, res) => {
  const q = req.query
  const messaging = req.body.entry[0].messaging
  if (messaging) {
    messaging.forEach((item) => {
      if (item.message && item.message.text) {
        processMessageText(item.sender.id, item.message.text)
      } else if (item.postback && item.postback.payload) {
        processPayload(senderId, item.postback.payload)
      }
    })
  }
  res.sendStatus(200)
})

function processPayload (senderId, payload) {
  if (payload.startsWith('EVENT_')) {
    const jsonPayload = payload.slice(6) // because event_ is 6 characters
  }
}

function processMessageText (senderId, text) {
  if (text.toLowerCase().includes('upcoming event')) {
    request('https://webuild.sg/api/v1/events?n=5', (err, resp, body) => {
      if (!err) {
        const parsed = JSON.parse(body)
        //send.text(senderId, `Here's the next 5 events:`)
        parsed.events.forEach((event) => {
          send.text(
            senderId,
            `${event.name}
Organizer: ${event.group_name}
Date & Time: ${event.formatted_time}
URL: ${event.url}
            `
          )
        })
        // We cannot use this because Facebook don't allow more than 3 buttons.
        // send.buttons (
        //   senderId,
        //   `Choose an upcoming event you're interested in`,
        //   parsed.events.map((event) => {
        //     return {
        //       type: 'postback',
        //       title: event.name,
        //       payload: `EVENT_a`
        //     }
        //   })
        // )
      }
    })
  }
}

app.listen(3124, () => {
  console.log('Example app listening on port 3124!')
})
