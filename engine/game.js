/* global Player, tileset, Vigilance */

const ctxObjects = document.getElementById('objects').getContext('2d')
const ctxSight = document.getElementById('sight').getContext('2d')
const [drawCollitions, noShadows] = [true, true]

// eslint-disable-next-line no-unused-vars
const game = {
  objects: {},
  insideMap: [],
  collitionMap: [],
  timer: null,
  ticker () {
    if (this.timer) clearInterval(this.timer)
    Vigilance.ctx.clearRect(0, 0, 512, 512)
    Vigilance.instances
      .filter(vg => vg.props.start)
      .forEach(vg => {
        vg.frame()
        this.generateSight(vg)
      })
    this.timer = setInterval(() => {
      this.ticker()
    }, 800)
  },
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
    this.drawObject(obj)
  },
  setObjects (objects) {
    this.objects = objects.filter(({ type }) => type !== 'prototype')
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
        this.drawObject(object)
      })
  },
  drawObject (object) {
    if (object.type === 'door') this.toggleVisibility(object)
    const proto = object.properties
    object.state = !!object.state
    object.col = {
      x: object.x + proto.col.x,
      y: object.y + proto.col.y,
      w: proto.col.w,
      h: proto.col.h
    }
    object.collitionIndex = this.computePosition(object.col.x, object.col.y).collitionIndex - 1
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
  computePosition (x, y) {
    const computed = { x: Math.floor(x / 16) + 2, y: Math.ceil(y / 16) + 2 }
    computed.collitionIndex = (computed.x - 1) + (computed.y - 1) * 32
    return computed
  },
  activateObject (x, y) {
    const ply = Player.getCurrent()
    const obj = this.objects.find(itm => {
      return itm.col.x <= x &&
        itm.col.x + itm.col.w >= x &&
        itm.col.y <= y &&
        itm.col.y + itm.col.h >= y
    })

    let direction = { x: 32, y: 0 }
    if (x < (ply.position.x + 8)) direction.x = -32
    if (y < (ply.position.y + 32)) direction = { x: 0, y: -48 }
    if (y > (ply.position.y + 32)) direction = { x: 0, y: 48 }

    if (!obj) return false
    ply.interactingWith = obj
    if (obj.state === true) {
      ply.move({ x: ply.position.x + direction.x, y: ply.position.y + direction.y }, true)
      if (obj.type === 'door') obj.state = false
      this.drawObject(obj)
      return false
    }

    obj.state = true
    this.drawObject(obj)
    return false
  },
  toggleVisibility (obj) {
    const { collitionIndex } = this.computePosition(obj.x - 16, obj.y - 16)
    this.obstaclesMap[collitionIndex] = obj.state ? 0 : -1
    this.setSight()
  },
  generateShadow (collitionIndex, pl) {
    const shadow = new Array(1024).fill(0)
    const playerX = Math.floor(collitionIndex % 32)
    const playerY = Math.floor(collitionIndex / 32)
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        // Calculate angle and distance from player to ever other item in obstaclesMap
        const dx = x - playerX
        const dy = y - playerY
        const angle = Math.atan2(dy, dx)
        const distance = Math.sqrt(dx ** 2 + dy ** 2)
        // Verificar si hay obstrucciones en la línea de vista
        let visibleObstacle = false
        for (let d = 1; d <= distance; d++) {
          const xObstruction = Math.round(playerX + d * Math.cos(angle))
          const yObstruction = Math.round(playerY + d * Math.sin(angle))
          const obstructionPosition = yObstruction * 32 + xObstruction
          if (xObstruction >= 0 && xObstruction < 32 && yObstruction >= 0 && yObstruction < 32) {
            if (this.obstaclesMap[obstructionPosition] !== 0) {
              if (!visibleObstacle) {
                shadow[obstructionPosition] = 1
                visibleObstacle = true
              }
              break
            } else {
              shadow[obstructionPosition] = 1
            }
          }
        }
      }
    }
    ctxSight.clearRect(pl.x + 8, pl.y + 16, 16, 16)
    shadow.forEach((val, index) => {
      if (val === 0) return
      ctxSight.clearRect((index % 32) * 16, Math.floor(index / 32) * 16, 16, 16)
    })
    ctxSight.closePath()
  },
  generateSight (vg) {
    const mapa = this.collitionMap
    const filas = 32
    const columnas = 32
    const tamanoMapa = filas * columnas
    const sombra = new Array(tamanoMapa).fill(0)
    let [x, y] = [vg.position.x, vg.position.y]

    const apertura = 60 / 2
    let rangoAngulos
    if (vg.props.type === 'guard' && ['down', 'left', 'up'].includes(vg.direction)) x -= 1
    if (vg.direction === 'right') rangoAngulos = [360 - apertura, apertura]
    if (vg.direction === 'down') rangoAngulos = [90 - apertura, 90 + apertura]
    if (vg.direction === 'left') rangoAngulos = [180 - apertura, 180 + apertura]
    if (vg.direction === 'up') rangoAngulos = [270 - apertura, 270 + apertura]

    if (vg.props.type === 'camera') {
      if (['right', 'left'].includes(vg.direction)) x -= 1
      if (vg.direction === 'right') rangoAngulos = [0, 45]
      if (vg.direction === 'left') rangoAngulos = [135, 180]
    }

    const posicionUnidad = this.computePosition(x, y).collitionIndex

    const xUnidad = Math.floor(posicionUnidad % columnas)
    const yUnidad = Math.floor(posicionUnidad / columnas)

    for (let y = 0; y < filas; y++) {
      for (let x = 0; x < columnas; x++) {
      // Calcular ángulo y distancia desde la unidad hasta la posición actual
        const dx = x - xUnidad
        const dy = y - yUnidad
        const angulo = Math.atan2(dy, dx)

        // Convertir el ángulo a grados
        const anguloGrados = (angulo * 180) / Math.PI

        // Mapear el ángulo al rango [0, 360)
        const anguloMapeado = (anguloGrados + 360) % 360

        // Verificar si el ángulo está dentro del rango especificado
        let anguloEnRango = false
        if (rangoAngulos[0] <= rangoAngulos[1]) {
          anguloEnRango = rangoAngulos[0] <= anguloMapeado && anguloMapeado <= rangoAngulos[1]
        } else {
          anguloEnRango =
          anguloMapeado >= rangoAngulos[0] || anguloMapeado <= rangoAngulos[1]
        }

        if (anguloEnRango) {
          const distancia = Math.sqrt((dx ** 2) + (dy ** 2))

          // Verificar si hay obstrucciones en la línea de vista
          let visibleObstacle = false
          for (let d = 1; d <= distancia; d++) {
            const xObstruccion = Math.round(xUnidad + d * Math.cos(angulo))
            const yObstruccion = Math.round(yUnidad + d * Math.sin(angulo))
            const posicionObstruccion = yObstruccion * columnas + xObstruccion

            if (
              xObstruccion >= 0 &&
              xObstruccion < columnas &&
              yObstruccion >= 0 &&
              yObstruccion < filas
            ) {
              if (mapa[posicionObstruccion] !== 0) {
                if (!visibleObstacle) {
                  sombra[posicionObstruccion] = 1
                  visibleObstacle = true
                }
                break
              } else {
                sombra[posicionObstruccion] = 1
              }
            }
          }
        }
      }
    }

    Vigilance.ctx.beginPath()
    sombra.forEach((val, index) => {
      if (val === 0) return
      Vigilance.ctx.rect((index % 32) * 16, Math.floor(index / 32) * 16, 16, 16)
    })
    Vigilance.ctx.fillStyle = `${this.palette[11]}66`
    Vigilance.ctx.fill()
    Vigilance.ctx.closePath()
  },
  setSight () {
    if (noShadows) return
    const players = Player.instances.map(({ position }) => position)
    ctxSight.beginPath()
    ctxSight.fillStyle = this.palette[0]
    ctxSight.rect(0, 0, 512, 512)
    ctxSight.fill()
    ctxSight.closePath()
    players.forEach(pl => {
      this.generateShadow(this.computePosition(pl.x, pl.y).collitionIndex, pl)
    })
  }
}
