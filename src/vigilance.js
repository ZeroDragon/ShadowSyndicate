import { game, drawCollitions } from './game'
import { Obj } from './objects'
import { tileset } from './user'

const ctxVfx = document.getElementById('vfx').getContext('2d')

export class Vigilance {
  constructor (item) {
    this.props = item
    this.position = { x: item.x, y: item.y }
    this.canMove = true
    this.width = this.props.width
    this.clearText = () => Vigilance.clearText(this)
    if (!Vigilance.instances) Vigilance.instances = []
    Vigilance.instances.push(this)
  }

  static ctx = document.getElementById('vigilance').getContext('2d')
  static ctxSight = document.getElementById('light').getContext('2d')

  static clearText (obj) {
    if (obj.textBound) {
      const bounds = obj.textBound
      ctxVfx.clearRect(bounds.x - 1, bounds.y - 1, bounds.w + 2, bounds.h + 2)
    }
  }

  static getCamera (id) {
    return Vigilance.instances.find(itm => itm.id === id)
  }

  static getActiveVigilance () {
    return Vigilance.instances
      .filter(vg => vg.props.start)
      .filter(vg => {
        if (vg.props.type === 'camera' && game.hasEnergy) return true
        if (vg.props.type !== 'camera') return true
        return false
      })
  }

  static getAll () {
    return Vigilance.instances
  }

  static createAll (instances) {
    Vigilance.chain = JSON.parse(JSON.stringify(instances))
      .map((itm, _index, self) => {
        const pointer = itm.properties.find(prop => prop.name === 'next')
        if (!pointer) return itm
        itm.next = pointer.value
        delete itm.properties
        delete itm.name
        delete itm.rotation
        delete itm.type
        delete itm.visible
        const next = self.find(stop => stop.id === pointer.value)
        let direction = 'up'
        if (itm.x < next.x) direction = 'right'
        if (itm.x > next.x) direction = 'left'
        if (itm.y < next.y) direction = 'down'
        itm.direction = direction
        return itm
      })
    instances
      .map(itm => {
        const start = itm.properties.find(prop => prop.name === 'start')
        if (start) itm.start = start.value
        else itm.start = false
        if (itm.type === 'camera') itm.start = true
        return itm
      })
      .filter(obj => {
        if (obj.type === 'guard' && !obj.start) return false
        return true
      })
      .map(itm => {
        Obj.prototypes.find(obj => obj.name === itm.type).properties
          .forEach(({ name, value }) => {
            itm[name] = JSON.parse(value)
          })
        return itm
      })
      .forEach(instance => {
        if (instance.type === 'camera') {
          const direction = instance.properties.find(itm => itm.name === 'direction').value
          instance.direction = direction
          instance.start = true
          delete instance.properties
          instance.Object = Obj.addObject(instance)
        }
        return new Vigilance(instance)
      })
  }

  static calculateDistance (x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  }

  static getInteractingWith ({ bound }) {
    const { x: px, y: py } = bound
    let closest = null
    let minDistance = Infinity
    Vigilance.instances
      .filter(vg => vg.props.type === 'guard')
      .forEach(vg => {
        const { x: vx, y: vy } = vg.col
        const distance = Vigilance.calculateDistance(px, py, vx, vy)
        if (distance < minDistance) {
          minDistance = distance
          closest = vg
        }
      })
    return closest
  }

  captureRadius ({ x, y, w, h }) {
    const filas = 32
    const columnas = 32
    const sombra = Array(filas * columnas).fill(0)

    // Calcular las coordenadas de la matriz que cubre el elemento
    const inicioFila = Math.max(0, Math.floor(y / 16))
    const finFila = Math.min(filas, Math.ceil((y + h) / 16))
    const inicioColumna = Math.max(0, Math.floor(x / 16))
    const finColumna = Math.min(columnas, Math.ceil((x + w) / 16))

    // Marcar las celdas correspondientes con 1
    for (let i = inicioFila; i < finFila; i++) {
      for (let j = inicioColumna; j < finColumna; j++) {
        const indice = i * columnas + j
        sombra[indice] = 1
      }
    }
    game.setTriggers({ type: 'halt', value: sombra })
    if (drawCollitions) {
      Vigilance.ctxSight.beginPath()
      sombra.forEach((val, index) => {
        if (val === 0) return
        Vigilance.ctxSight.rect((index % 32) * 16, Math.floor(index / 32) * 16, 16, 16)
      })
      Vigilance.ctxSight.fillStyle = `${game.palette[11]}66`
      Vigilance.ctxSight.fill()
      Vigilance.ctxSight.closePath()
    }
  }

  frame () {
    this.x = this.position.x
    this.y = this.position.y
    if (!this.canMove) return this.draw()
    if (!this.id) this.id = this.props.id
    const pointer = Vigilance.chain.find(prop => prop.id === this.id)
    const next = Vigilance.chain.find(stop => stop.id === pointer.next) || {}
    this.direction = pointer.direction
    if (this.direction === 'right') Object.assign(this.position, { x: this.position.x + 16 })
    if (this.direction === 'left') Object.assign(this.position, { x: this.position.x - 16 })
    if (this.direction === 'down') Object.assign(this.position, { y: this.position.y + 16 })
    if (this.direction === 'up') Object.assign(this.position, { y: this.position.y - 16 })

    this.col = { x: this.position.x - 16, y: this.position.y, w: 64, h: 64 }

    if (this.props.type === 'camera') this.direction = this.props.direction
    if (next.x === this.position.x && next.y === this.position.y) {
      this.id = next.id
    }
    this.step = !this.step
    this.draw()
  }

  draw () {
    if (this.props.type === 'camera') return // cameras are drawed in the game loop
    const normAlt = { true: 'Alt', false: '' }[!this.step]
    const sprite = `${this.direction}${normAlt}`
    const ctx = Vigilance.ctx
    ctx.beginPath()
    ctx.drawImage(
      tileset,
      this.props[sprite].x,
      this.props[sprite].y,
      this.props.width,
      this.props.height,
      this.position.x,
      this.position.y,
      this.props.width,
      this.props.height
    )
    ctx.closePath()
    this.captureRadius(this.col)
    return sprite
  }
}
