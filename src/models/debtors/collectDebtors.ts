import { createSelector } from '@reduxjs/toolkit'
import { add, sub } from 'shared/helpers/currencyHelpers'
import { getDebtAccountId } from 'models/accounts'
import { getMerchants } from 'models/data/selectors'
import { getTransactionsHistory } from 'models/transactions'
import { getType } from 'models/transactions/helpers'
import {
  ById,
  TAccountId,
  TInstrumentId,
  TMerchant,
  TMerchantId,
  TTransaction,
  TrType,
  TSelector,
} from 'shared/types'

type TFxAmount = {
  [currency: TInstrumentId]: number
}

type TDebtor = {
  id: string
  name: string
  merchantId?: TMerchantId
  merchantName?: string
  payeeNames: string[]
  transactions: TTransaction[]
  balance: TFxAmount
}

export const getDebtors: TSelector<ById<TDebtor>> = createSelector(
  [getTransactionsHistory, getMerchants, getDebtAccountId],
  (transactions, merchants, debtAccId) => {
    let res = collectDebtors(transactions, merchants, debtAccId)
    return res
  }
)

function collectDebtors(
  trList: TTransaction[],
  merchants: ById<TMerchant>,
  debtAccId?: TAccountId
): ById<TDebtor> {
  const debtors: ById<TDebtor> = {}
  trList.forEach(tr => {
    const trType = getType(tr, debtAccId)
    if (trType !== TrType.incomeDebt && trType !== TrType.outcomeDebt) {
      // Not debt transaction
      return
    }
    let debtor
    if (tr.merchant) {
      let merchant = merchants[tr.merchant]
      let id = cleanPayee(merchant.title)
      debtor = debtors[id] ??= makeDebtorFromMerchant(merchant)
      debtor.merchantId = merchant.id
      debtor.merchantName = merchant.title
      debtor.transactions.push(tr)
    } else if (tr.payee) {
      let payee = tr.payee
      let id = cleanPayee(payee)
      debtor = debtors[id] ??= makeDebtorFromPayee(payee)
      if (!debtor.payeeNames.includes(payee)) {
        debtor.payeeNames.push(payee)
      }
      debtor.transactions.push(tr)
    }
    if (!debtor) return
    if (trType === TrType.incomeDebt) {
      debtor.balance[tr.incomeInstrument] ??= 0
      debtor.balance[tr.incomeInstrument] = sub(
        debtor.balance[tr.incomeInstrument],
        tr.income
      )
    } else {
      debtor.balance[tr.outcomeInstrument] ??= 0
      debtor.balance[tr.outcomeInstrument] = add(
        debtor.balance[tr.outcomeInstrument],
        tr.outcome
      )
    }
  })
  return debtors
}

function makeDebtorFromMerchant(merchant: TMerchant): TDebtor {
  return {
    id: cleanPayee(merchant.title),
    name: merchant.title,
    merchantId: merchant.id,
    merchantName: merchant.title,
    payeeNames: [],
    transactions: [],
    balance: {},
  }
}

function makeDebtorFromPayee(payee: string): TDebtor {
  return {
    id: cleanPayee(payee),
    name: payee,
    merchantId: undefined,
    merchantName: undefined,
    payeeNames: [payee],
    transactions: [],
    balance: {},
  }
}

/**
 * Cleans name from whitespaces and punctuation marks.
 * Leaves only digits and latin and cyrillic letters.
 */
function cleanPayee(name: string) {
  return name.replace(/[^\d\wа-яА-ЯёЁ]/g, '').toLowerCase()
}
