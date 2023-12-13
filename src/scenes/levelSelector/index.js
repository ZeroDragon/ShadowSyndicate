import { gameLevel } from '../game/index.js'
import { reset } from '../../ShadowSyndicate'
import { userKeys } from '../../user'

const background = document.getElementById('background').getContext('2d')
const first = document.getElementById('floor').getContext('2d')
const second = document.getElementById('light').getContext('2d')

let position = 0
let line = null
let currentLine = null
const padding = 10
const w = 116
const h = 50

const loadImage = _ => {
  const p = new Promise(resolve => {
    const image = new Image()
    image.onload = function () {
      background.beginPath()
      background.drawImage(image, 0, 0, 1024, 1024, 10, 10, 492, 492)
      background.rect(0, 0, 512, 512)
      background.fillStyle = '#000000dd'
      background.fill()
      background.closePath()
      background.beginPath()
      background.rect(10, 410, 492, 92)
      background.lineWidth = '2'
      background.strokeStyle = '#ffffff66'
      background.stroke()
      background.closePath()
      resolve()
    }
    image.src = require('~/public/images/darkgueb.png')
  })
  return p
}

const loadLevels = _ => {
  const p = new Promise(resolve => {
    fetch('./levels/index.json')
      .then(response => {
        return response.json()
      })
      .then((data) => {
        resolve(data)
      })
  })
  return p
}

let slowDrawing = null
const slowDraw = (index = 0) => {
  slowDrawing = true
  if (index === 0) {
    first.beginPath()
    first.clearRect(0, 0, 512, 512)
    first.closePath()
  }
  const item = currentLine[index]
  if (!item) {
    slowDrawing = false
    return
  }
  const col = index % 4
  const row = Math.floor(index / 4)
  const left = padding + col * w + col * padding
  const top = padding + row * h + row * padding
  first.beginPath()
  first.rect(left, top, w, h)
  first.lineWidth = '2'
  first.strokeStyle = '#ffffff66'
  first.stroke()
  first.closePath()
  setTimeout(() => {
    first.beginPath()
    first.textAlign = 'center'
    first.fillStyle = '#fff'
    first.font = '10px "Press Start 2P"'
    first.fillText(item.name, left + w / 2, top + 5 + h / 2)
    first.closePath()
  }, 100)
  const p = new Promise(resolve => {
    setTimeout(() => {
      resolve(slowDraw(index + 1))
    }, 200)
  })
  return p
}

const drawCursor = _ => {
  const col = position % 4
  const row = Math.floor(position / 4)
  const left = padding + col * w + col * padding
  const top = padding + row * h + row * padding
  second.beginPath()
  second.clearRect(0, 0, 512, 512)
  second.rect(left, top, w, h)
  second.lineWidth = '2'
  second.strokeStyle = '#ff000066'
  second.stroke()
  second.closePath()
}

const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
  const words = text.split(' ')
  let line = ''

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' '
    const metrics = context.measureText(testLine)
    const testWidth = metrics.width

    if (testWidth > maxWidth && i > 0) {
      context.fillText(line, x, y)
      line = words[i] + ' '
      y += lineHeight
    } else {
      line = testLine
    }
  }

  context.fillText(line, x, y)
}

const drawDescription = _ => {
  const item = currentLine[position]
  first.clearRect(10, 410, 492, 92)
  drawCursor()
  setTimeout(() => {
    first.beginPath()
    first.textAlign = 'left'
    first.fillStyle = '#fff'
    first.font = '10px "Press Start 2P"'
    wrapText(first, item.description, 20, 430, 482, 20)
    first.closePath()
  }, 100)
}

const drawSelectedOptions = async _ => {
  position = 0
  drawCursor()
  await slowDraw()
  drawDescription()
}

const selectOption = async user => {
  if (slowDrawing) return
  const itm = currentLine[position]
  if (itm.levels) {
    currentLine = [
      {
        name: '<] return',
        description: '',
        path: '<goback>'
      },
      ...currentLine[position].levels
    ]
    drawSelectedOptions()
  } else if (itm.path === '<goback>') {
    currentLine = line
    drawSelectedOptions()
  } else {
    reset()
    gameLevel(`./levels/${itm.path}`, user)
  }
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
    case userKeys.rightKey:
      position += 1
      if (position === currentLine.length) position = 0
      drawDescription()
      break
    case userKeys.leftKey:
      position -= 1
      if (position === -1) position = currentLine.length - 1
      drawDescription()
      break
    case userKeys.aKey:
      selectOption(user)
      break
  }
}

export const selector = async user => {
  reset()
  await loadImage()
  line = await loadLevels()
  currentLine = line
  drawSelectedOptions()
  user.changeTrigger(eventsTrigger(user))
}
