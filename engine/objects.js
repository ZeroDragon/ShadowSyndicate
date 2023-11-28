/* global Player, tileset, drawCollitions, game */
const ctxObjects = document.getElementById('objects').getContext('2d')

// eslint-disable-next-line no-unused-vars
const objects = {
  setPrototypes (objects) {
    this.prototypes = objects.filter(({ type }) => type === 'prototype')
  },
  addObject (obj) {
    if (!obj.properties) obj.properties = {}
    this.prototypes.find(prot => prot.name === obj.type).properties
      .forEach(({ name, value }) => {
        obj.properties[name] = JSON.parse(value)
      })
    this.objects.push(obj)
    objects.drawObject(obj)
  },
  setObjects (objs) {
    this.objects = objs.filter(({ type }) => type !== 'prototype')
    this.objects
      .map(object => {
        if (!object.properties) object.properties = {}
        this.prototypes.find(obj => obj.name === object.type).properties
          .forEach(({ name, value }) => {
            object.properties[name] = JSON.parse(value)
          })
        return object
      })
      .forEach(object => {
        objects.drawObject(object)
      })
  },
  drawObject (object) {
    if (object.type === 'door') game.toggleVisibility(object)
    const proto = object.properties
    object.state = !!object.state
    object.col = {
      x: object.x + proto.col.x,
      y: object.y + proto.col.y,
      w: proto.col.w,
      h: proto.col.h
    }
    object.collitionIndex = game.computePosition(object.col.x, object.col.y).collitionIndex - 1
    ctxObjects.clearRect(object.x, object.y, object.width, object.height)
    if (object.type === 'camera') {
      const normAlt = object.state ? '' : 'Alt'
      proto[object.state] = object[`${object.direction}${normAlt}`]
    }
    ctxObjects.drawImage(
      tileset,
      proto[object.state].x, // source x
      proto[object.state].y, // source y
      object.width, // source width
      object.height, // source height
      object.x, // desination x
      object.y, // destination y
      object.width, // destination width
      object.height // destination height
    )
    if (drawCollitions) {
      // draw collition on object
      ctxObjects.rect(
        object.col.x,
        object.col.y,
        object.col.w,
        object.col.h
      )
      ctxObjects.stroke()
    }
  },
  activateObject (x, y) {
    const ply = Player.getCurrent()
    x = x + ply.position.col.x
    y = y + ply.position.col.y

    const left1 = x
    const right1 = x + ply.bound.w
    const top1 = y
    const bottom1 = y + ply.bound.h

    const obj = this.objects.find(itm => {
      const left2 = itm.col.x
      const right2 = itm.col.x + itm.col.w
      const top2 = itm.col.y
      const bottom2 = itm.col.y + itm.col.h
      return left1 < right2 && right1 > left2 && top1 < bottom2 && bottom1 > top2
    })

    if (!obj) return false

    if (obj.properties.restrictFrom?.includes(ply.movement)) return

    let direction = { x: 32, y: 0 }
    if (x < (ply.position.x + 8)) direction.x = -32
    if (y < (ply.position.y + 32)) direction = { x: 0, y: -48 }
    if (y > (ply.position.y + 32)) direction = { x: 0, y: 48 }

    ply.interactingWith = obj

    if (obj.state === true) {
      if (['window', 'door'].includes(obj.type)) {
        ply.move({ x: ply.position.x + direction.x, y: ply.position.y + direction.y }, true)
      }

      if (obj.properties.returnState) {
        obj.state = false
        this.drawObject(obj)
        return false
      }
    }

    obj.state = true
    this.drawObject(obj)
    if (obj.properties.interactive) {
      ply.stance = 'kneeled'
      ply.draw()
    }
    return false
  }
}
