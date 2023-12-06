import { gameLevel } from '../game/index.js'
import { game } from '../game/game.js'
import { Player } from '../game/player'
import { reset } from '../../ShadowSyndicate'
import { userKeys } from '../../user'

const ctxBg = document.getElementById('background').getContext('2d')

const leftText = (text, y) => {
  ctxBg.fillStyle = game.palette[1]
  ctxBg.textAlign = 'left'
  ctxBg.fillText(text, 50, y)
}
const rightText = (text, y) => {
  ctxBg.fillStyle = game.palette[5]
  if (parseInt(text, 10) < 0) ctxBg.fillStyle = game.palette[4]
  ctxBg.textAlign = 'right'
  ctxBg.fillText(`$${text}`, 450, y)
}

export const gameOver = user => {
  const loot = JSON.parse(JSON.stringify(game.brain.get('loot')))
  console.log(loot)
  reset()

  ctxBg.font = '14px "Press Start 2P"'

  const bail = Player.instances
    .filter(pl => {
      return !pl.playerScaped || pl.freezed
    })
    .map(_ => {
      return ['Enterpreneur caught', -2000]
    })

  let lastK
  const total = [
    ['Incoming balance', game.brain.get('balance')],
    ...loot,
    ['Daily expenses', -52],
    ...bail
  ]
    .map(([desc, value], key) => {
      lastK = key
      leftText(desc, 100 + key * 25)
      rightText(value, 100 + key * 25)
      return value
    })
    .reduce((prev, curr) => prev + curr)
  leftText('Total', 100 + (lastK + 3) * 25)
  rightText(total, 100 + (lastK + 3) * 25)

  ctxBg.fillStyle = game.palette[1]
  if (total < 0) {
    ctxBg.textAlign = 'left'
    ctxBg.fillText('Your "carreer" is over', 50, 400)
  }

  game.brain.set('balance', Math.max(0, total))

  setTimeout(() => {
    ctxBg.textAlign = 'left'
    ctxBg.fillText('[> Go back', 50, 450)
    user.changeTrigger(eventsTrigger(user))
  }, 2000)
}

let throttler = -Infinity
const eventsTrigger = (user) => (keyCode) => {
  const now = new Date().getTime()
  if (now - throttler < 60) return
  throttler = new Date().getTime()
  playerActions(keyCode, user)
}

const playerActions = (keyCode, user) => {
  switch (keyCode) {
    case userKeys.leftKey:
      gameLevel('./levels/0001', user)
      break
  }
}
