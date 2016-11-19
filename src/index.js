'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const config = require('config')
const Datastore = require('nedb')
const moment = require('moment')
const users = new Datastore({ filename: './data/users', autoload: true })
const eventSpeech = require('./speech')
const app = express()
const mapsApiKey = config.get('mapsApiKey')

app.use(bodyParser.json())
app.set('json spaces', 2)

const Ranka = require('ranka')
const ranka = new Ranka({
  validationToken: config.get('validationToken'),
  pageAccessToken: config.get('pageAccessToken')
})
app.use('/webuild/bot/webhook', Ranka.router({
  ranka: ranka
}))

ranka.on('message', (req, res) => {
  // users.findOne({ id: recipientId }, function (err, doc) {
  //   if (doc === null) {
  //     users.insert({ id: recipientId })
  //   }
  // })
  const eventRequest = eventSpeech.getParsedRequest(req.message.text)
  if (eventRequest.mode === 'event') {
    upcomingEvent(eventRequest, req, res)
  } else if (eventRequest.mode === 'podcast') {
    request('https://webuild.sg/api/v1/podcasts', (err, resp, body) => {
      if (!err) {
        const parsed = JSON.parse(body)
        const next = body.meta.next_live_show
        const prev = body.podcasts[0]
        res
          .sendText(`The next podcast features ${next.description} and will commence on ${moment(next.start_time).format('dddd, MMMM Do YYYY, h:mm:ss a')}!`)
          .sendText(`Meanwhile, checkout our previous podcast featuring ${prev.description}`)
          .sendAudio(prev.download_link)
          .exec()
      }
    })
  } else if (eventRequest.mode === 'repo') {
    request('https://webuild.sg/api/v1/repos?n=5', (err, resp, body) => {
      if (!err) {
        const parsed = JSON.parse(body)
        parsed.repos.forEach((repo) => {
          res
            .sendText(`${repo.owner.login}/${repo.name}
${repo.html_url}
          `)
            .exec()
        })
      }
    })
  } else {
    res
      .sendText("Sorry, I don't understand. Do you like to send a location instead?")
      .send({
        text: 'Please share your location:',
        quick_replies: [
          {
            content_type: 'location'
          }
        ]
      }).exec()
  }
})

function generateFbPayload (events) {
  const nomap = 'https://raw.githubusercontent.com/webuildsg/bot/master/no-map.png'
  return events.map((event) => {
    let payload = {
      title: `${event.name}`,
      'image_url': nomap,
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
        }
      ]
    }
    if (event.latitude && event.longitude) {
      payload.image_url = `https://maps.googleapis.com/maps/api/staticmap?zoom=13&size=500x500&maptype=roadmap&markers=color:red%7C${event.latitude},${event.longitude}&key=${mapsApiKey}`
      payload.buttons.unshift({
        'type': 'web_url',
        'url': `https://maps.google.com/maps?f=q&hl=en&q=${event.latitude},${event.longitude}`,
        'title': 'Get Directions'
      })
    }
    return payload
  })
}

function sendEvent (events, req, res) {
  const eventCount = +events.meta.total_events
  if (eventCount === 0) {
    res
      .sendText('No events found :( Try another day')
      .exec()
  } else if (eventCount > 0) {
    const eventsDisplay = events.meta.total_events === 1 ? 'event' : 'events'
    const eventElements = generateFbPayload(events.events)
    res
      .sendText(`We found you ${eventCount} cool ${eventsDisplay} for you to join!`)
      .typing()
      .wait(1000)
      .sendTemplate({
        template_type: 'generic',
        elements: eventElements
      })
      .exec()
  }
}

/**
 * Fetches 5 upcoming events or by event date
 * @param  {[type]} recipientId [description]
 */
function upcomingEvent (eventRequest, req, res) {
  if (eventRequest.dates) {
    request(`https://webuild.sg/api/v1/check/${eventRequest.dates.year}-${eventRequest.dates.month + 1}-${eventRequest.dates.day}?n=5`, (err, resp, body) => {
      if (!err) {
        const parsed = JSON.parse(body)
        sendEvent(parsed, req, res)
      }
    })
  } else {
    request('https://webuild.sg/api/v1/events?n=5', (err, resp, body) => {
      if (!err) {
        const parsed = JSON.parse(body)
        sendEvent(parsed, req, res)
      }
    })
  }
}

app.listen(3124, () => {
  console.log('Example app listening on port 3124!')
})
