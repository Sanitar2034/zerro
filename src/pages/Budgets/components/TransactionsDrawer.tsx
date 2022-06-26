import React, { FC } from 'react'
import { useAppSelector } from 'models'
import { useMonth } from '../pathHooks'
import { useSearchParam } from 'shared/hooks/useSearchParam'
import { TransactionsDrawer } from 'components/TransactionsDrawer'
import { getInBudgetAccounts } from 'models/accounts'
import { getTagAccMap } from 'models/hiddenData/accTagMap'
import { getPopulatedTags } from 'models/tags'
import { FilterConditions } from 'models/transactions/filtering'
import endOfMonth from 'date-fns/endOfMonth'
import { TrType } from 'shared/types'

export const BudgetTransactionsDrawer: FC = () => {
  const [month] = useMonth()
  const [id, setId] = useSearchParam('transactions')
  const accountsInBudget = useAppSelector(getInBudgetAccounts).map(a => a.id)
  const tagAccMap = useAppSelector(getTagAccMap)
  const tagsById = useAppSelector(getPopulatedTags)

  const onClose = () => setId(undefined)

  if (!id) return <TransactionsDrawer open={false} onClose={onClose} />

  const tag = tagsById[id]
  const tagIds = [tag.id, ...tag.children]

  let prefilter: FilterConditions[] = []
  prefilter.push({
    type: TrType.outcome,
    dateFrom: month,
    dateTo: endOfMonth(new Date(month)),
    accountsFrom: accountsInBudget,
    mainTags: tagIds,
  })
  tagIds.forEach(id => {
    if (tagAccMap[id]) {
      prefilter.push({
        type: TrType.transfer,
        dateFrom: month,
        dateTo: endOfMonth(new Date(month)),
        accountsFrom: accountsInBudget,
        accountsTo: tagAccMap[id],
      })
      prefilter.push({
        type: TrType.transfer,
        dateFrom: month,
        dateTo: endOfMonth(new Date(month)),
        accountsFrom: tagAccMap[id],
        accountsTo: accountsInBudget,
      })
    }
  })

  return (
    <TransactionsDrawer prefilter={prefilter} open={!!id} onClose={onClose} />
  )
}
