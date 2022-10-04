import { createSelector } from '@reduxjs/toolkit'
import { TISOMonth, TDateDraft } from '@shared/types'
import { keys } from '@shared/helpers/keys'
import { toISOMonth } from '@shared/helpers/date'
import { TSelector } from '@store'
import { TFxRateData, getRates } from './getFxRates'

export const getFxRatesGetter: TSelector<(date: TDateDraft) => TFxRateData> =
  createSelector([getRates], rates => (date: TDateDraft): TFxRateData => {
    const month = toISOMonth(date)
    if (rates[month]) return rates[month]
    const d = findDate(keys(rates).sort(), month)
    return rates[d]
  })

/**
 * Returns the exact date from the array
 * or previous date no exact match
 * or the first date in the array if no previous date
 * expects sorted array
 */
function findDate(dates: TISOMonth[], target: TISOMonth): TISOMonth {
  const prevDates = dates.filter(d => d <= target).sort()
  if (prevDates.length) {
    // return the last available date
    return prevDates[prevDates.length - 1]
  }
  return dates[0] // first available date
}