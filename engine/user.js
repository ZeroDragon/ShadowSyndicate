/* global Player, Vigilance, game */
const canvas = document.getElementById('background')
const ctxBg = canvas.getContext('2d')
const ctxWalls = document.getElementById('walls').getContext('2d')
const ctxPlayer1 = document.getElementById('player1').getContext('2d')
const ctxPlayer2 = document.getElementById('player2').getContext('2d')
const ctxOver = document.getElementById('overlayer').getContext('2d')

const leftKey = 37
const upKey = 38
const rightKey = 39
const downKey = 40
const zkey = 90
const tileset = new Image()
let throttler = -Infinity

document.addEventListener('keydown', ({ keyCode }) => {
  const now = new Date().getTime()
  if (now - throttler < 60) return
  throttler = new Date().getTime()
  const ply = Player.getCurrent()
  switch (keyCode) {
    case leftKey:
      ply.position.flip = true
      ply.move({ x: ply.position.x - 16 })
      break
    case rightKey:
      ply.position.flip = false
      ply.move({ x: ply.position.x + 16 })
      break
    case upKey:
      ply.move({ y: ply.position.y - 16 })
      break
    case downKey:
      ply.move({ y: ply.position.y + 16 })
      break
    case zkey:
      Player.instances.forEach(player => player.toggleActivation())
      break
  }
})

const loadMetadata = (map, name, section = 'data') => {
  const layer = map.layers.find(layer => layer.name === name)
  if (layer) return layer[section]
  return []
}

const setPalette = tileset => {
  const rgbToHex = (r, g, b) => {
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b)
  }
  const componentToHex = c => {
    const hex = c.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  const tcanv = document.createElement('canvas')
  tcanv.width = tileset.width
  tcanv.height = tileset.height
  const tCtx = tcanv.getContext('2d', { willReadFrequently: true })
  tCtx.drawImage(tileset, 0, 0, tileset.width, tileset.height)

  game.palette = []
  for (let y = 4; y <= 20; y += 16) {
    for (let x = 4; x <= 116; x += 16) {
      const pixelData = tCtx.getImageData(x, y, 1, 1).data
      const hex = rgbToHex(pixelData[0], pixelData[1], pixelData[2])
      game.palette.push(hex)
    }
  }
}

const preload = level => {
  Player.create(ctxPlayer1, -8, 0, true)
  Player.create(ctxPlayer2, -8, 32)
  fetch(`${level}/map.json`)
    .then(response => response.json())
    .then((map) => {
      const tileSource = map.properties.find(itm => itm.name === 'tileset')
      tileset.onload = function () {
        setPalette(tileset)
        game.insideMap = loadMetadata(map, 'floor')
        game.collitionMap = loadMetadata(map, 'collitions')
        game.obstaclesMap = loadMetadata(map, 'obstacles')
        game.setPrototypes(loadMetadata(map, 'objects', 'objects'))
        game.setObjects(loadMetadata(map, 'objects', 'objects'))
        Vigilance.createAll(loadMetadata(map, 'vigilance', 'objects'))
        Player.instances.forEach(player => player.draw())
        ctxBg.beginPath()
        ctxBg.fillStyle = game.palette[0]
        ctxBg.rect(0, 0, 512, 512)
        ctxBg.fill()
        ctxBg.closePath()
        map.layers
          .filter(layer => layer.visible && layer.type === 'tilelayer')
          .forEach(itm => {
            let ctx = ctxBg
            if (itm.name === 'overlayer') ctx = ctxOver
            if (itm.name === 'walls') ctx = ctxWalls
            const data = itm.data
            data.forEach((tile, index) => {
              if (tile === 0) return
              ctx.drawImage(
                tileset,
                ((tile - 1) % 8) * 16, // source x
                Math.floor((tile - 1) / 8) * 16, // source y
                16, // source width
                16, // source height
                (index % 32) * 16, // desination x
                Math.floor(index / 32) * 16, // destination y
                16, // destination width
                16 // destination height
              )
            })
          })
        game.ticker()
      }
      tileset.src = `${level}/${tileSource.value}`
    })
}

preload('levels/0001')