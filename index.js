import sleep from 'sleep'
import chalk from 'chalk'
import { iterateWithBreaks } from './utils.js'
import client from './client.js'

const unlike = async tweet => {
  const errorHandle = () => {
    console.log(chalk.red(`❌ - https://www.twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`))
  }
  const promise = client.post('favorites/destroy', {
    id: tweet.id_str
  })

  const successHandle = res => {
    console.log(chalk.green(`✅ - https://www.twitter.com/${res.user.screen_name}/status/${res.id_str}`))
  }
  return await iterateWithBreaks(promise, errorHandle, successHandle)
}

const fetchLikes = async () => {
  const favs = await client.get('favorites/list', {
    count: 200
  })
  console.log(`${favs.length} favs found...`)
  return favs
}

const handleUnlikes = async favs => {
  for (let i = 0, len = favs.length; i < len; i++) {
    const next = await unlike(favs[i])
    sleep.sleep(next)
  }

  return true
}

;(async () => {
  let favs = await fetchLikes()
  while (favs && favs.length > 0) {
    await handleUnlikes(favs)
    favs = await fetchLikes()
  }
  console.log('Eskeler!!!')
})()
