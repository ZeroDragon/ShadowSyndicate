import { selector } from '../levelSelector'
import { reset } from '../../ShadowSyndicate'
import { userKeys } from '../../user'
import { initAudio } from '../../sfx'

const ctxBg = document.getElementById('background').getContext('2d')

export const initial = user => {
  reset()

  const image = new Image()
  image.onload = function () {
    ctxBg.drawImage(image, 0, 0, 1024, 1024, 50, 0, 412, 412)
    setTimeout(() => {
      ctxBg.textAlign = 'right'
      ctxBg.fillStyle = '#fff'
      ctxBg.strokeStyle = '#000'
      ctxBg.font = '40px "Press Start 2P"'
      ctxBg.fillText('Shadow', 450, 350)
      ctxBg.fillText('Syndicate', 450, 400)
      ctxBg.strokeText('Shadow', 450, 350)
      ctxBg.strokeText('Syndicate', 450, 400)
    }, 200)
  }
  image.src = require('~/public/images/logo.png')

  setTimeout(() => {
    ctxBg.textAlign = 'left'
    ctxBg.fillStyle = '#fff'
    ctxBg.font = '14px "Press Start 2P"'
    ctxBg.fillText('Press <] to start', 50, 450)
    user.changeTrigger(eventsTrigger(user))
  }, 500)
}

let throttler = -Infinity
const eventsTrigger = (user) => (keyCode) => {
  const now = new Date().getTime()
  if (now - throttler < 60) return
  throttler = new Date().getTime()
  playerActions(keyCode, user)
}

const playerActions = (keyCode, user) => {
  initAudio()
  switch (keyCode) {
    case userKeys.rightKey:
      selector(user)
      break
  }
}
