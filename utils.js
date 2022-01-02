import chalk from 'chalk'

/**
 * @param { Promise } promise
 * @param { Object } improved - If you need to enhance the error.
 * @return { Promise }
 * @example const [err, res] = await promiser(ApiRequest.get("/foo/"));
 */
export const promiser = (promise, improved) => promise
  .then((data) => [null, data])
  .catch((err) => {
    if (improved) {
      Object.assign(err, improved)
    }

    return [err] // which is same as [err, undefined];
  })

const handleError = e => {
  if ('errors' in e) {
    if (e.errors[0].code === 88) {
      console.log('Rate limit will reset on', new Date(e._headers.get('x-rate-limit-reset') * 1000))
    } else {
      console.log('API Related Error...')
      console.log(e.errors)
    }
  } else {
    console.log('non-API Error')
    console.log(e)
  }
}

export const iterateWithBreaks = async (promise, errorHandle, successHandle) => {
  let next = 1
  let remaining = 0
  const [e, res] = await promiser(promise)

  if (e) {
    if (errorHandle) errorHandle(e)
    handleError(e)
    return next
  }

  const headers = res._headers
  remaining = parseInt(headers.get('x-rate-limit-remaining'))

  if (!isNaN(remaining) && remaining === 0) {
    console.log(chalk.cyan('Waiting'))
    next = parseInt(headers.get('x-rate-limit-reset')) - Date.now()
    next = next / 1000
  }

  if (successHandle) successHandle(res)
  return next
}
