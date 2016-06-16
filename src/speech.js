'use strict'
const nlp = require('nlp_compromise')

exports.getParsedRequest = function getParsedRequest (text) {
  const nlpText = nlp.text(text)
  let dates = nlpText.dates()
  const root = nlpText.root()
  let output = {
    mode: root.includes('event') ? 'event' : root.includes('repo') ? 'repo' : undefined,
    upcoming: root.includes('upcoming')
  }
  console.log(dates)
  if (dates.length >= 1) {
    output.dates = dates
      .map((date) => date.data)
      .reduce((prev, curr) => {
        Object.keys(prev).forEach((d) => curr[d] = curr[d] || prev[d])
        return curr
      }, {year: null, month: null, day: null})
    output.dates.year = output.dates.year || (new Date()).getUTCFullYear()
  }
  return output
}
