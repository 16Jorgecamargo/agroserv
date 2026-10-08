import { users } from '../data/users'
import { saveSession } from '../utils/storage'

export function signInAsDemoProducer() {
  saveSession('mock.usr-1', users[0])
}
