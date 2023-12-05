import { User } from './user'
import { gameLevel } from './scenes/game'

const user = new User()

gameLevel('./levels/0001', user)
