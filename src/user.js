export const userKeys = {
  leftKey: 65,
  upKey: 87,
  rightKey: 68,
  downKey: 83,
  aKey: 'K'.charCodeAt(),
  bKey: 'J'.charCodeAt()
}

export class User {
  constructor (trigger = () => {}) {
    this.interval = null
    this.eventsTrigger = trigger
    document.addEventListener('keydown', ({ keyCode }) => {
      this.eventsTrigger(keyCode)
    })
    const items = [...document.querySelectorAll('.input')]
    items.forEach(button => {
      const eventStart = event => {
        this.interval = setInterval(() => {
          const buttonName = event.target.className
            .split(' ')
            .filter(name => name !== 'input')[0]
          this.eventsTrigger(userKeys[`${buttonName}Key`])
        }, 50)
      }
      const eventEnd = _ => {
        clearInterval(this.interval)
      }
      button.addEventListener('touchstart', eventStart)
      button.addEventListener('touchend', eventEnd)
      button.addEventListener('mousedown', eventStart)
      button.addEventListener('mouseup', eventEnd)
    })
    document.querySelector('body').addEventListener('touchend', (e) => {
      e.preventDefault()
    })
  }

  changeTrigger (trigger) {
    this.eventsTrigger = trigger
  }
}
