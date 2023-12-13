const {
  readFileSync: rf,
  writeFileSync: wf,
  readdirSync: rd,
  lstatSync: stat
} = require('fs')
const { resolve } = require('path')

class Item {
  constructor (type) {
    if (!Item.instances) Item.instances = {}
    if (!Item.instances[type]) Item.instances[type] = []
    Item.instances[type].push(this)
  }

  static clearCampaigns () {
    Item.instances.campaign = Item.instances.campaign
      .filter(itm => itm.name)
      .map(itm => {
        itm.number = ~~itm.number
        return itm
      })
      .sort((a, b) => {
        if (a.number > b.number) return 1
        if (a.number < b.number) return -1
        return 0
      })
  }

  static setCampaigns () {
    Item.clearCampaigns()
    Item.instances.level.forEach(itm => {
      const camp = Item.instances.campaign.find(cp => cp.name === itm.campaign)
      camp.insertLevel(itm)
    })
  }

  static checkConsistency () {
    Item.clearCampaigns()
    const indexes = {}
    Item.instances.campaign.forEach(camp => {
      if (indexes[camp.number]) {
        console.error('Error: campaign exists with same number')
        process.exit(1)
      }
      indexes[camp.number] = true
    })
  }

  set (key, value) {
    if (key === 'tileset') return
    this[key] = value
  }

  insertLevel (level) {
    if (!this.levels) this.levels = []
    this.levels.push(level)
  }
}

rd(resolve(__dirname, 'levels'))
  .filter(file => stat(resolve(__dirname, 'levels', file)).isDirectory())
  .forEach(dir => {
    const map = rf(resolve(__dirname, 'levels', dir, 'map.json'), 'utf8')
    const { properties } = JSON.parse(map)
    const campaign = new Item('campaign')
    const level = new Item('level')
    level.set('path', dir)
    properties.forEach(prop => {
      const [levelProp, campaignProp] = prop.name.split('-')
      if (campaignProp) {
        campaign.set(campaignProp, prop.value)
      } else {
        level.set(levelProp, prop.value)
      }
    })
    Item.checkConsistency()
  })

Item.setCampaigns()

wf(resolve(__dirname, 'levels', 'index.json'), JSON.stringify(Item.instances.campaign, false, 2))
