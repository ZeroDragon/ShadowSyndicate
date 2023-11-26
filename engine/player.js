/* global game, drawCollitions, tileset */

// eslint-disable-next-line no-unused-vars
class Player {
  constructor (ctx, x, y, active = false) {
    this.position = {
      x, y, flip: true, inside: false, col: { x: 8, y: 32 }
    }
    this.active = active
    this.ctx = ctx
    if (!Player.instances) Player.instances = []
    Player.instances.push(this)
  }

  static create (...params) {
    return new Player(...params)
  }

  static getCurrent () {
    return Player.instances.find(player => player.active)
  }

  setBound () {
    this.bound = {
      x: this.position.x + this.position.col.x,
      y: this.position.y + this.position.col.y
    }
  }

  toggleActivation () {
    this.draw()
    this.active = !this.active
    if (!this.active) return
    const offset = this.position.flip ? 16 : 12
    this.ctx.beginPath()
    this.ctx.rect(this.position.x + offset, this.position.y + 24, 4, 4)
    this.ctx.fillStyle = game.palette[1]
    this.ctx.fill()
    this.ctx.closePath()
  }

  move ({ x = this.position.x, y = this.position.y }, jump = false) {
    this.movement = 'up'
    if (x - this.position.x > 0) this.movement = 'right'
    if (x - this.position.x < 0) this.movement = 'left'
    if (y - this.position.y > 0) this.movement = 'down'
    this.setBound()
    if (this.interactingWith && this.interactingWith.properties.constraints) {
      const { x: oX, y: oY } = this.interactingWith
      const pX = this.position.x + 8
      const pY = this.position.col.y + this.position.y
      let relative = 'up'
      if (oX < pX) relative = 'left'
      else if (oX > pX) relative = 'right'
      else if (oY > pY) relative = 'down'

      // dont let move char if not in constraints
      if (!this.interactingWith.properties.constraints.includes(this.movement)) return

      if (
        (relative === 'up' && this.movement === 'down') ||
        (relative === 'down' && this.movement === 'up')
      ) {
        this.interactingWith.state = false
        game.drawObject(this.interactingWith)
        delete this.interactingWith
        return
      }
    }

    // we moved away, lets clear the object
    delete this.interactingWith

    if (!jump) {
      const computed = game.computePosition(x, y + 16)
      if (computed.x < 1 || computed.x > 32 || computed.y < 2 || computed.y > 32) return
      if (game.activateObject(x + this.position.col.x, y + this.position.col.y)) return
      if (game.collitionMap[computed.collitionIndex] !== 0) return
    }
    this.position.x = x
    this.position.y = y
    this.draw()
  }

  draw () {
    this.setBound()
    const { collitionIndex } = game.computePosition(this.position.x, this.position.y)
    this.position.inside = game.insideMap[collitionIndex] !== 0
    this.ctx.beginPath()
    this.ctx.clearRect(0, 0, 512, 512)
    const [spriteX, spriteY] = {
      // flipped, inside
      'false,false': [64, 80],
      'true,false': [32, 80],
      'true,true': [32, 128],
      'false,true': [64, 128]
    }[[this.position.flip, this.position.inside].join(',')]
    this.ctx.drawImage(tileset, spriteX, spriteY, 32, 48, this.position.x, this.position.y, 32, 48)
    if (drawCollitions) {
      // draw collition on player
      this.ctx.rect(this.bound.x, this.bound.y, 16, 16)
      this.ctx.strokeStyle = game.palette[1]
      this.ctx.stroke()
    }
    this.ctx.closePath()
    game.setSight()
  }
}
