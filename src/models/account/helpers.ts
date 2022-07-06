import { AccountType, IAccount } from 'shared/types'

export function getStartBalance(acc: IAccount): number {
  //  Для deposit и loan поле startBalance имеет смысл начального взноса/тела кредита
  if (acc.type === AccountType.Deposit) return 0
  if (acc.type === AccountType.Loan) return 0
  return acc.startBalance
}

export function isInBudget(a: IAccount): boolean {
  if (a.type === AccountType.Debt) return false
  if (a.title.endsWith('📍')) return true
  return a.inBalance
}
