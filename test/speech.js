const expect = require('chai').expect
const eventSpeech = require('../src/speech')
describe('speech', function () {
  describe('getParsedRequest', function () {
    it('should figure out the request mode', function () {
      expect(eventSpeech.getParsedRequest('testing').mode).to.be.undefined
      expect(eventSpeech.getParsedRequest('some events please').mode).to.equal('event')
      expect(eventSpeech.getParsedRequest('some repos please').mode).to.equal('repo')
      expect(eventSpeech.getParsedRequest('some repository please').mode).to.equal('repo')
    })
    it('should detect if there is a date', function () {
      // No date means undefined
      expect(eventSpeech.getParsedRequest('testing').dates).to.be.undefined
    })

    it('should figure out the date requested', function () {
      // This doesn't test much since tests should be covered in nlp_compromise
      expect(eventSpeech.getParsedRequest('july 4th').dates.month).to.equal(6)
      expect(eventSpeech.getParsedRequest('4-july').dates.year).to.equal((new Date()).getUTCFullYear())
      expect(eventSpeech.getParsedRequest('july 4th 2020').dates.year).to.equal(2020)
      expect(eventSpeech.getParsedRequest('I married April for the 2nd time on June 5th 1998').dates.year).to.equal(1998)
    })
  })
})
