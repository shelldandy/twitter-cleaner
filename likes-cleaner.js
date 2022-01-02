'use strict'

const chalk = require('chalk')
const Twitter = require('twitter')
const jsonfile = require('jsonfile')
const config = require('./config')

function getTweets () {
  global.window = { YTD: { like: { } } }
  require(config.path)
  return window.YTD.like.part0.map(object => object.like)
}

const logFile = config.log || './log.json'
let log
try {
  log = require(logFile)
} catch (e) {
  console.log(chalk.cyan('No log file, starting a fresh delete cycle.'))
  log = []
}

const maxDate = config.maxDate ? new Date(config.maxDate) : new Date()

const client = new Twitter({
  consumer_key: config.consumer_key,
  consumer_secret: config.consumer_secret,
  access_token_key: config.access_token_key,
  access_token_secret: config.access_token_secret
})

main()

function main () {
  const rawTweets = getTweets()

  const logIds = log.map(l => l.tweetId)
  const tweets = rawTweets.filter(t => {
    const hasId = !isNaN(parseInt(t.tweetId))
    const shouldBeSaved = config.saveRegexp.some((regexp) => new RegExp(regexp).test(t.full_text))
    const notDeleted = logIds.indexOf(t.tweetId) === -1
    return hasId && notDeleted && !shouldBeSaved
  })

  if (!tweets || !tweets.length) {
    return console.log(chalk.green('No more tweets to delete!'))
  }

  console.log(chalk.green(`Starting tweets cleaner on ${Date.now()} - Deleting tweets older than ${maxDate}`))
  deleteTweet(tweets, 0)
}

function deleteTweet (tweets, i) {
  let next = config.callsInterval
  let remaining = 0

  client.post('favorites/destroy', { id: tweets[i].tweetId }, function (err, _, res) {
    remaining = parseInt(res.headers['x-rate-limit-remaining'])

    if (!isNaN(remaining) && remaining === 0) {
      console.log(chalk.cyan('Waiting'))
      next = parseInt(res.headers['x-rate-limit-reset']) - Date.now()
    } else {
      if (err) {
        console.log(chalk.yellow(JSON.stringify(err)))
      } else {
        log.push(tweets[i])
        console.log(chalk.green(`Deleted -> ${tweets[i].tweetId} | ${tweets[i].fullText}`))
      }
    }

    jsonfile.writeFile(logFile, log, { spaces: 2 }, function (err) {
      if (err) {
        return console.log(chalk.red('ERROR WRITING JSON!'))
      }

      if (i + 1 === tweets.length) {
        return console.log(chalk.green('Done!'))
      }

      console.log(chalk.green(`Next call in ${next}ms`))
      setTimeout(function () {
        deleteTweet(tweets, i + 1)
      }, next)
    })
  })
}
