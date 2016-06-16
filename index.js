const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const process = require('process')
const send = require('./send')
const eventSpeech = require('./src/speech')
const app = express()
const verifyToken = process.env.verifyToken
const mapsApiKey = process.env.mapsApiKey

app.use(bodyParser.json())
app.set('json spaces', 2)

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

function processNlpEvent (nlpText) {
  const root = nlpText.root()
  return {
    upcoming: root.includes('upcoming'),
    dates: nlpText.dates()[0]
  }
}
function processMessageText (senderId, text) {
  const eventRequest = eventSpeech.getParsedRequest(text)
  if (eventRequest.mode === 'event') {
    upcomingEvent(senderId, eventRequest)
  } else if (eventRequest.mode === 'repo') {
    latestRepo(senderId)
  }
}

/**
 * Fetches the latest 5 repositories
 * @param  {[type]} senderId [description]
 */
function latestRepo (senderId) {
  request('https://webuild.sg/api/v1/repos?n=5', (err, resp, body) => {
    if (!err) {
      const parsed = JSON.parse(body)
      parsed.repos.forEach((repo) => {
        send.text(
          senderId,
          `${repo.owner.login}/${repo.name}
${repo.html_url}
          `
        )
      })
    }
  })
}

function generateFbPayload (events) {
  return events.map((event) => {
    return {
      'title': `${event.name}`,
      'image_url': `https://maps.googleapis.com/maps/api/staticmap?zoom=13&size=500x500&maptype=roadmap&markers=color:red%7C${event.latitude},${event.longitude}&key=${mapsApiKey}`,
      'subtitle': `${event.group_name} | ${event.formatted_time}`,
      'buttons': [
        {
          'type': 'web_url',
          'url': event.url,
          'title': 'View Event'
        },
        {
          'type': 'web_url',
          'url': event.group_url,
          'title': 'View Group'
        },
        {
          'type': 'web_url',
          'url': `https://maps.google.com/maps?f=q&hl=en&q=${event.latitude},${event.longitude}`,
          'title': 'Get Directions'
        }
      ]
    }
  })
}
/**
 * Fetches 5 upcoming events or by event date
 * @param  {[type]} senderId [description]
 */
function upcomingEvent (senderId, eventRequest) {
  if (eventRequest.dates) {
console.log(`https://webuild.sg/api/v1/check/${eventRequest.dates.year}-${eventRequest.dates.month}-${eventRequest.dates.day}?n=5`)
    request(`https://webuild.sg/api/v1/check/${eventRequest.dates.year}-${eventRequest.dates.month+1}-${eventRequest.dates.day}?n=5`, (err, resp, body) => {
      if (!err) {
        const parsed = JSON.parse(body)
        var eventElements = generateFbPayload(parsed.events)
        send.genericTemplate(senderId, eventElements)
      }
    })
  } else {
    request('https://webuild.sg/api/v1/events?n=5', (err, resp, body) => {
      if (!err) {
        const parsed = JSON.parse(body)
        var eventElements = generateFbPayload(parsed.events)
        send.genericTemplate(senderId, eventElements)
      }
    })
  }
}

app.listen(3124, () => {
  console.log('Example app listening on port 3124!')
})
