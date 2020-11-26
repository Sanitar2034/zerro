import startOfMonth from 'date-fns/startOfMonth'
import startOfDay from 'date-fns/startOfDay'
import startOfWeek from 'date-fns/startOfWeek'
import { AccountId, Tag, TagId, Transaction, TransactionId } from 'types'

type TransactionType = 'income' | 'outcome' | 'transfer'
type OperatorType = 'AND' | 'OR'

interface FilerConditions {
  search?: null | string
  type?: null | TransactionType
  showDeleted?: boolean
  dateFrom?: null | number | Date
  dateTo?: null | number | Date
  tags?: null | TagId[]
  accountsFrom?: null | AccountId[]
  accountsTo?: null | AccountId[]
  amountFrom?: null | number
  amountTo?: null | number
}

const checkSearch = (tr: Transaction, search?: FilerConditions['search']) => {
  if (!search) return true
  if (tr.comment?.toUpperCase().includes(search.toUpperCase())) return true
  if (tr.payee?.toUpperCase().includes(search.toUpperCase())) return true
  return false
}

const checkType = (tr: Transaction, type?: FilerConditions['type']) =>
  !type || getType(tr) === type

const checkDeleted = (
  tr: Transaction,
  showDeleted?: FilerConditions['showDeleted']
) => showDeleted || !tr.deleted

const checkDate = (
  tr: Transaction,
  dateFrom?: FilerConditions['dateFrom'],
  dateTo?: FilerConditions['dateTo']
) => (!dateFrom || +tr.date >= +dateFrom) && (!dateTo || +tr.date <= +dateTo)

const checkAccounts = (
  tr: Transaction,
  accountsFrom?: FilerConditions['accountsFrom'],
  accountsTo?: FilerConditions['accountsTo']
) => {
  const check = (current: AccountId, need?: null | AccountId[]) =>
    need ? need.includes(current) : true
  return (
    check(tr.incomeAccount, accountsTo) &&
    check(tr.outcomeAccount, accountsFrom)
  )
}

const checkTags = (tr: Transaction, tags?: FilerConditions['tags']) => {
  if (!tags || !tags.length) return true
  if (!tr.tag && tags.includes(null) && getType(tr) !== 'transfer') return true
  if (!tr.tag) return false
  let result = false
  tr.tag.forEach(id => {
    if (tags.includes(id)) result = true
  })
  return result
}

const checkAmount = (
  tr: Transaction,
  amount?: FilerConditions['amountFrom'],
  compareType: 'greaterOrEqual' | 'lessOrEqual' = 'lessOrEqual'
) => {
  if (!amount) return true
  const trAmount = getType(tr) === 'income' ? tr.income : tr.outcome
  return compareType === 'lessOrEqual' ? trAmount <= amount : trAmount >= amount
}

const checkConditions = (tr: Transaction, conditions: FilerConditions) => {
  if (!conditions) return true
  return (
    checkType(tr, conditions.type) &&
    checkDeleted(tr, conditions.showDeleted) &&
    checkSearch(tr, conditions.search) &&
    checkDate(tr, conditions.dateFrom, conditions.dateTo) &&
    checkTags(tr, conditions.tags) &&
    checkAmount(tr, conditions.amountFrom, 'greaterOrEqual') &&
    checkAmount(tr, conditions.amountTo, 'lessOrEqual') &&
    checkAccounts(tr, conditions.accountsFrom, conditions.accountsTo)
  )
}

export const checkRaw = (
  conditions: FilerConditions | FilerConditions[] = {},
  operator: OperatorType = 'OR'
) => (tr: Transaction) => {
  if (Array.isArray(conditions)) {
    const results = conditions.map(cond => checkConditions(tr, cond))
    return operator === 'AND' ? results.every(Boolean) : results.some(Boolean)
  }
  return checkConditions(tr, conditions)
}

/**
 * Groups array of transactions
 */
export function groupTransactionsBy(
  groupType: 'DAY' | 'WEEK' | 'MONTH' = 'DAY',
  arr: Transaction[] = [],
  filterConditions?: FilerConditions
) {
  const groupTypes = {
    DAY: (date: number | Date) => startOfDay(date),
    WEEK: (date: number | Date) => startOfWeek(date, { weekStartsOn: 1 }),
    MONTH: (date: number | Date) => startOfMonth(date),
  }
  const converter = groupTypes[groupType]
  const checker = checkRaw(filterConditions)
  let groups: {
    [k: string]: { date: number; transactions: TransactionId[] }
  } = {}

  for (const tr of arr) {
    if (checker(tr)) {
      const date = +converter(tr.date)
      if (groups[date]) groups[date].transactions.push(tr.id)
      else groups[date] = { date, transactions: [tr.id] }
    }
  }

  return Object.values(groups)
}

type SortType = 'DATE' | 'CHANGED'
export function sortBy(sortType: SortType = 'DATE', ascending = false) {
  const sortFuncs = {
    DATE: (tr1: Transaction, tr2: Transaction) => {
      const result =
        +tr2.date === +tr1.date
          ? tr2.created - tr1.created
          : tr2.date - tr1.date
      return ascending ? -result : result
    },
    CHANGED: (tr1: Transaction, tr2: Transaction) =>
      ascending ? tr1.changed - tr2.changed : tr2.changed - tr1.changed,
  }
  return sortFuncs[sortType]
}

interface TagsObj {
  [tagId: string]: Tag
}
export function mapTags(ids: TagId[], tags: TagsObj) {
  // TODO: Надо что-то придумать с null тегом 🤔    ⤵
  return ids && ids.length ? ids.map(id => tags[id + '']) : null
}

export function getType(tr: Transaction) {
  return tr.income && tr.outcome ? 'transfer' : tr.income ? 'income' : 'outcome'
}

export function getTime(tr: Transaction) {
  const creationDate = new Date(tr.created)
  const hours = creationDate.getHours()
  const minutes = creationDate.getMinutes()
  const seconds = creationDate.getSeconds()
  const trTime = new Date(tr.date)
  trTime.setHours(hours, minutes, seconds)
  return +trTime
}

export function getMainTag(tr: Transaction) {
  return tr.tag && tr.tag.length ? tr.tag[0] : null
}
