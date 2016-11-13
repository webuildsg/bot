const config = require('config')
const request = require('request')
const accessToken = config.get('pageAccessToken')

/**
 * Sends only a text message
 * @param  {[type]} recipientId [description]
 * @param  {[type]} text     [description]
 * @return {[type]}          [description]
 */
exports.text = function (recipientId, text) {
  api(recipientId, {
    text: text
  })
}

exports.attachPayload = function (recipientId, payload) {
  api(recipientId, {
    attachment: {
      type: 'template',
      payload: payload
    }
  })
}

/**
 * For generic templates
 * @param  {[type]} recipientId [description]
 * @param  {[type]} elements [description]
 * @return {[type]}          [description]
 */
exports.genericTemplate = function (recipientId, elements) {
  exports.attachPayload(recipientId, {
    template_type: 'generic',
    elements: elements
  })
}

exports.buttons = function (recipientId, text, buttons) {
  exports.attachPayload(recipientId, {
    template_type: 'button',
    text: text,
    buttons: buttons
  })
}

/**
 * generic send api
 * @param  {[type]} recipientId [description]
 * @param  {[type]} message  [description]
 * @return {[type]}          [description]
 */
function api (recipientId, message, cb) {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: accessToken
    },
    method: 'POST',
    json: {
      recipient: {
        id: recipientId
      },
      message: message
    }
  }, function (err, resp) {
    cb(err, resp)
  })
}
