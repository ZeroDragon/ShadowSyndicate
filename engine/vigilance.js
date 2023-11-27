/* global tileset, game */

// eslint-disable-next-line no-unused-vars
class Vigilance {
  constructor (item) {
    this.props = item
    this.position = { x: item.x, y: item.y }
    if (!Vigilance.instances) Vigilance.instances = []
    Vigilance.instances.push(this)
  }

  static ctx = document.getElementById('vigilance').getContext('2d')

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
      .map((itm, k) => {
        console.log(k)
        game.prototypes.find(obj => obj.name === itm.type).properties
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
        }
        return new Vigilance(instance)
      })
  }

  frame () {
    if (this.props.type !== 'camera') this.step = !this.step
    if (!this.id) this.id = this.props.id
    const pointer = Vigilance.chain.find(prop => prop.id === this.id)
    const next = Vigilance.chain.find(stop => stop.id === pointer.next) || {}
    this.direction = pointer.direction
    if (this.direction === 'right') Object.assign(this.position, { x: this.position.x + 16 })
    if (this.direction === 'left') Object.assign(this.position, { x: this.position.x - 16 })
    if (this.direction === 'down') Object.assign(this.position, { y: this.position.y + 16 })
    if (this.direction === 'up') Object.assign(this.position, { y: this.position.y - 16 })
    if (this.props.type === 'camera') this.direction = this.props.direction
    if (next.x === this.position.x && next.y === this.position.y) {
      this.id = next.id
    }
    this.draw()
  }

  draw () {
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
    return sprite
  }
}
