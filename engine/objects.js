/* global Player, tileset, drawCollitions, game playNote, createSoundMap ctxVfx */

// eslint-disable-next-line no-unused-vars
class Obj {
  constructor (obj) {
    this.ctx = document.getElementById('objects').getContext('2d')
    Object.entries(obj).forEach(([key, value]) => {
      this[key] = JSON.parse(JSON.stringify(value))
    })
    const proto = this.properties
    this.state = !!this.state
    this.combinationStep = 0
    this.combinationTicks = 0
    this.combinationFailed = false
    this.combinationSuccess = false
    this.clearText = () => Obj.clearText(this)
    this.col = {
      x: this.x + proto.col.x,
      y: this.y + proto.col.y,
      w: proto.col.w,
      h: proto.col.h
    }
    this.collitionIndex = game.computePosition(this.col.x, this.col.y).collitionIndex - 1
  }

  static setPrototypes (objs) {
    Obj.prototypes = objs.filter(({ type }) => type === 'prototype')
  }

  static clearText (obj) {
    if (obj.textBound) {
      const bounds = obj.textBound
      ctxVfx.clearRect(bounds.x - 1, bounds.y - 1, bounds.w + 2, bounds.h + 2)
    }
  }

  static setObjects (objs) {
    objs
      .filter(({ type }) => type !== 'prototype')
      .forEach(obj => {
        Obj.addObject(obj)
      })
  }

  static addObject (obj) {
    if (!obj.properties) obj.properties = {}
    if (Array.isArray(obj.properties)) {
      const tmpProps = {}
      obj.properties.forEach(({ name, value }) => {
        tmpProps[name] = value
      })
      obj.properties = tmpProps
    }
    Obj.prototypes.find(prot => prot.name === obj.type).properties
      .forEach(({ name, value }) => {
        obj.properties[name] = JSON.parse(value)
      })
    const nobj = new Obj(obj)
    if (!Obj.instances) Obj.instances = []
    Obj.instances.push(nobj)
    nobj.draw()
    return nobj
  }

  static returnCollition (x, y, ply) {
    const left1 = x
    const right1 = x + ply.bound.w
    const top1 = y
    const bottom1 = y + ply.bound.h

    return Obj.instances.find(itm => {
      const left2 = itm.col.x
      const right2 = itm.col.x + itm.col.w
      const top2 = itm.col.y
      const bottom2 = itm.col.y + itm.col.h
      return left1 < right2 && right1 > left2 && top1 < bottom2 && bottom1 > top2
    })
  }

  static activateObject (intentedX, intentedY) {
    const ply = Player.getCurrent()
    const x = intentedX + ply.position.col.x
    const y = intentedY + ply.position.col.y
    const obj = Obj.returnCollition(x, y, ply)
    if (!obj) return false

    if (obj.properties.restrictFrom?.includes(ply.movement)) return

    let direction = { x: 32, y: 0 }
    if (x < (ply.position.x + 8)) direction.x = -32
    if (y < (ply.position.y + 32)) direction = { x: 0, y: -48 }
    if (y > (ply.position.y + 32)) direction = { x: 0, y: 48 }

    ply.interactingWith = obj

    if (obj.state === true) {
      if (obj.properties.gateway) {
        ply.move({ x: ply.position.x + direction.x, y: ply.position.y + direction.y }, true)
      }
      if (obj.properties.returnState) {
        obj.setState(false)
        obj.draw()
        return false
      }
    }

    if (obj.properties.interactive) {
      ply.stance = 'kneeled'
      ply.draw()
    }

    if (obj.properties.changeConditions) return obj.changeConditions()
    if (!obj.state) obj.setState(true)
    obj.draw()
    return false
  }

  draw () {
    if (this.type === 'door') game.toggleVisibility(this)
    const proto = this.properties
    this.ctx.clearRect(this.x, this.y, this.width, this.height)
    if (this.type === 'camera') {
      const normAlt = this.state ? '' : 'Alt'
      proto[this.state] = this[`${this.direction}${normAlt}`]
    }
    this.ctx.drawImage(
      tileset,
      proto[this.state].x, // source x
      proto[this.state].y, // source y
      this.width, // source width
      this.height, // source height
      this.x, // desination x
      this.y, // destination y
      this.width, // destination width
      this.height // destination height
    )
    if (this.type === 'statue') this.statue()
    if (drawCollitions) {
      // draw collition on object
      this.ctx.rect(
        this.col.x,
        this.col.y,
        this.col.w,
        this.col.h
      )
      this.ctx.stroke()
    }
  }

  setState (value) {
    if (this.type === 'fuse') {
      game.hasEnergy = !value
    }
    if (!this.state && value) {
      if (['computer', 'safe', 'statue'].includes(this.type)) this.success()
    }
    this.state = value
    game.triggerSight()
  }

  changeConditions () {
    if (this[this.type]) this[this.type]()
  }

  success () {
    const tableOfValues = {
      computer: [
        ['Cat Pictures', 1],
        ['Blackmail evidence', 1000],
        ['Confidential documents', 2000]
      ],
      safe: [
        ['Some cash', 500],
        ['Good cash', 1000],
        ['Very good cash', 1500],
        ['Confidential documents', 2000],
        ['Diamonds', 3000]
      ],
      statue: [
        ['Valuable statue', 100],
        ['Limited edition figure', 300],
        ['Action figure', 70],
        ['Collectable toy', 80]
      ]
    }
    const set = tableOfValues[this.type]
    if (!game.loot) game.loot = []
    game.loot.push(set[Math.floor(Math.random() * set.length - 1)])
  }

  reset () {
    if (this.properties.returnState) {
      this.setState(false)
      this.draw()
    }
    if (this.type === 'safe' || this.type === 'computer') {
      this.combinationStep = 0
      this.combinationTicks = 0
      this.combinationFailed = false
      this.booting = false
      this.clearText()
      ctxVfx.clearRect(this.x + 8, this.y + 4, 16, 8)
      if (this.type === 'computer') {
        playNote(createSoundMap(['E4', 'G3'], [60, 100]), 0.4)
        if (this.bootingTime) clearTimeout(this.bootingTime)
      }
    }
  }

  computer () {
    const getNewDirection = (prev) => {
      const directions = ['left', 'up', 'right']
      let direction = prev
      while (direction === prev) {
        direction = directions[Math.floor(Math.random() * directions.length)]
      }
      return direction
    }
    if (!this.combination) {
      this.combination = []
      let prev = null
      for (let x = 0; x <= 10; x++) {
        const newDirection = getNewDirection(prev)
        this.combination.push(newDirection)
        prev = newDirection
      }
    }
    if (this.booting) return
    if (this.combinationStep === 0) {
      this.booting = true
      this.computerDisplay()
      playNote(createSoundMap(['G3', 'E4'], [60, 100]), 0.4)
      this.bootingTime = setTimeout(() => {
        this.combinationStep += 1
        this.computerDisplay()
        this.booting = false
      }, 1000)
      return
    }
    const ply = Player.getCurrent()
    const direction = this.combination[this.combinationStep]
    if (!direction) {
      this.combinationSuccess = true
      this.computerDisplay()
      ctxVfx.fillStyle = game.palette[1]
      game.displayText('Computer hacked', this)
      this.setState(true)
      return
    }
    if (this.combinationSuccess || this.combinationFailed) return
    if (direction === ply.movement) {
      this.combinationStep += 1
      if (!this.combination[this.combinationStep]) return this.computer()
    } else {
      this.combinationFailed = true
    }
    this.computerDisplay()
  }

  statue () {
    const proto = this.properties
    const source = proto[proto.variant]
    this.ctx.clearRect(
      this.x + 4,
      this.y - 4,
      source.w,
      source.h
    )
    if (this.state) return
    this.ctx.drawImage(
      tileset,
      source.x, // source x
      source.y, // source y
      source.w, // source width
      source.h, // source height
      this.x + 4, // desination x
      this.y - 4, // destination y
      source.w, // destination width
      source.h // destination height
    )
  }

  safe () {
    if (this.combinationFailed) return
    if (!this.combination) {
      this.combination = [
        ...new Array(Math.round(Math.random() * (9 - 5) + 5))
      ].map(_ => Math.round(Math.random() * 5) + 1)
      this.combination[1] = Math.max(2, this.combination[1])
    }
    if (this.combinationStep === 0) {
      this.combinationStep += 1
      return
    }
    const direction = ['left', 'right'][this.combinationStep % 2]
    const ply = Player.getCurrent()
    if (ply.movement === 'up' && this.combinationSuccess && this.combinationStep !== 1) {
      this.setState(true)
      this.draw()
      return
    }

    if (this.combinationSuccess && this.state) return

    if (direction === ply.movement) {
      this.combinationTicks += 1
      displayCombination(this.combination, this.combinationStep, this)
    } else {
      this.combinationFailed = true
      this.combinationSuccess = false
      displayCombination(this.combination, this.combinationStep, this)
      playNote(createSoundMap(['E4', '', 'A3'], [60, 200, 250]), 0.4)
      return
    }

    if (this.combination[this.combinationStep] - this.combinationTicks === 0) {
      this.combinationStep += 1
      this.combinationTicks = 0
      displayCombination(this.combination, this.combinationStep, this)
      if (this.combination[this.combinationStep]) playNote(createSoundMap(['A3'], [60]), 0.4)
    } else {
      playNote(createSoundMap(['A2'], [60]), 0.4)
    }

    if (!this.combination[this.combinationStep]) {
      this.combinationSuccess = true
      displayCombination(this.combination, this.combinationStep, this)
      playNote(createSoundMap(['G5', ' ', 'A5'], [50, 50, 50]), 0.4)
    }
  }

  computerDisplay () {
    ctxVfx.clearRect(this.x + 8, this.y + 4, 16, 8)

    ctxVfx.beginPath()
    if (this.combinationStep === 0) {
      ctxVfx.fillStyle = game.palette[3]
    } else if (this.combinationFailed) {
      ctxVfx.fillStyle = game.palette[4]
    } else if (this.combinationSuccess) {
      ctxVfx.fillStyle = game.palette[5]
    } else {
      ctxVfx.fillStyle = game.palette[3]
    }

    ctxVfx.rect(this.x + 8, this.y + 4, 16, 8)
    ctxVfx.fill()
    ctxVfx.closePath()

    if (this.combinationStep === 0) return
    if (this.combinationFailed || this.combinationSuccess) return

    ctxVfx.beginPath()
    ctxVfx.fillStyle = game.palette[5]
    const displayDirection = {
      up: [this.x + 12, this.y + 4, 8, 4],
      left: [this.x + 8, this.y + 4, 4, 8],
      right: [this.x + 20, this.y + 4, 4, 8]
    }[this.combination[this.combinationStep]]
    ctxVfx.rect(...displayDirection)
    ctxVfx.fill()
    ctxVfx.closePath()
  }
}

const displayCombination = (combination, combinationStep, obj) => {
  let text = new Array(combination.length - 1).fill('')
  text = text.map((_itm, key) => {
    if (key === combinationStep - 1) return '[*]'
    if (key >= combinationStep - 1) {
      // maybe dificulty ?
      // const direction = ['>', '<'][key % 2]
      // return `[${direction}]`
      // return '[*]'
      return ''
    }
    return `[${combination[key + 1]}]`
  }).filter(itm => itm !== '').join('')
  ctxVfx.fillStyle = game.palette[1]
  if (obj.combinationSuccess) {
    ctxVfx.fillStyle = game.palette[1]
    text = 'Safe unlocked'
  }
  if (obj.combinationFailed) ctxVfx.fillStyle = game.palette[4]
  game.displayText(text, obj)
}
