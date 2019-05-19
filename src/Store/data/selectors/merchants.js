import createSelector from 'selectorator'
import { getUsersById } from './users'

export const normalize = ({ users }, raw) => ({
  id: raw.id,
  user: users[raw.user],
  title: raw.title,
  changed: raw.changed * 1000
})

export const getMerchantsById = createSelector(
  [getUsersById, 'data.merchant'],
  (users, merchants) => {
    const result = {}
    for (const id in merchants) {
      result[id] = normalize({ users }, merchants[id])
    }
    return result
  }
)

export const getMerchant = (state, id) => getMerchantsById(state)[id]