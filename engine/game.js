/* global Player, Vigilance createSoundMap, playNote */
const ctxSight = document.getElementById('sight').getContext('2d')

// eslint-disable-next-line no-unused-vars
const ctxVfx = document.getElementById('vfx').getContext('2d')

// eslint-disable-next-line no-unused-vars
const [drawCollitions, noShadows, noSounds] = [true, true, true]
// eslint-disable-next-line no-unused-vars
const game = {
  objects: {},
  insideMap: [],
  collitionMap: [],
  timer: null,
  stepValue: 0,
  ticker () {
    if (this.stepValue === 10) this.stepValue = 0
    this.stepValue += 1
    if (!noSounds) {
      const stepSound = ['F2', 'C2'][this.stepValue % 2]
      playNote(createSoundMap([stepSound], [400]))
    }
    if (this.timer) clearInterval(this.timer)
    Vigilance.ctx.clearRect(0, 0, 512, 512)
    Vigilance.ctxSight.clearRect(0, 0, 512, 512)
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
  computePosition (x, y) {
    const computed = { x: Math.floor(x / 16) + 2, y: Math.ceil(y / 16) + 2 }
    computed.collitionIndex = (computed.x - 1) + (computed.y - 1) * 32
    return computed
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
    if (vg.props.Object?.state) return
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

    Vigilance.ctxSight.beginPath()
    sombra.forEach((val, index) => {
      if (val === 0) return
      Vigilance.ctxSight.rect((index % 32) * 16, Math.floor(index / 32) * 16, 16, 16)
    })
    Vigilance.ctxSight.fillStyle = `${this.palette[11]}66`
    Vigilance.ctxSight.fill()
    Vigilance.ctxSight.closePath()
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
