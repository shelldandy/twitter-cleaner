import client from './client.js'
import { iterateWithBreaks } from './utils.js'
import sleep from 'sleep'
import chalk from 'chalk'

const untweet = async tweet => {
  const errorHandle = () => {
    console.log(chalk.red(`❌ - https://www.twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`))
  }
  const promise = client.post('statuses/destroy', {
    id: tweet.id_str
  })

  const successHandle = res => {
    console.log(chalk.green(`✅ - https://www.twitter.com/${res.user.screen_name}/status/${res.id_str}`))
  }

  return await iterateWithBreaks(promise, errorHandle, successHandle)
}

const fetchTweets = async () => {
  const tweets = await client.get('statuses/user_timeline', { count: 200 })
  console.log(`${tweets.length} tweets found...`)
  return tweets
}

const handleUntweets = async tweets => {
  for (let i = 0, len = tweets.length; i < len; i++) {
    const next = await untweet(tweets[i])
    sleep.sleep(next)
  }

  return true
}

;(async () => {
  console.log('Fetching tweets...')
  let tweets = await fetchTweets()
  while (tweets && tweets.length > 0) {
    await handleUntweets(tweets)
    tweets = await fetchTweets()
  }
})()
