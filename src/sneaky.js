import { User } from './user'
import { gameLevel } from './scenes/game'
import { game } from './scenes/game/game'

class Brain {
  constructor () {
    const gameData = JSON.parse(localStorage.sneaky || '{}')
    Object.entries(gameData).forEach(([k, v]) => { this[k] = v })
    if (!this.balance) this.balance = 0
    this.balance = ~~this.balance
  }

  save () {
    localStorage.sneaky = JSON.stringify(this)
  }

  set (key, value) {
    this[key] = value
    this.save()
  }

  push (key, value) {
    this[key].push(value)
    this.save()
  }

  get (key) {
    return this[key]
  }
}

const user = new User()

export const reset = _ => {
  game.brain = new Brain()
  game.brain.set('loot', [])
  const ctxBg = document.getElementById('background').getContext('2d')
  const canvases = document.querySelectorAll('canvas')
  canvases.forEach(canv => {
    const ctx = canv.getContext('2d')
    ctx.clearRect(0, 0, 512, 512)
  })
  ctxBg.beginPath()
  ctxBg.rect(0, 0, 512, 512)
  ctxBg.fillStyle = game.palette[0]
  ctxBg.fill()
  ctxBg.closePath()
}

gameLevel('./levels/0001', user)
