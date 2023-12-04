import { User } from './user'
import { preload } from './scenes/game'

const user = new User()

preload('./levels/0001', user)
