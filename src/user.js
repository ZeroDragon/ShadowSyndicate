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
      button.addEventListener('touchstart', (event) => {
        this.interval = setInterval(() => {
          const [, input] = event.target.className.split(' ')
          this.eventsTrigger(userKeys[`${input}Key`])
        }, 50)
      })
      button.addEventListener('touchend', _ => {
        clearInterval(this.interval)
      })
    })
    document.querySelector('body').addEventListener('touchend', (e) => {
      e.preventDefault()
    })
  }

  changeTrigger (trigger) {
    this.eventsTrigger = trigger
  }
}
