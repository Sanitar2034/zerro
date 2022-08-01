import React, { FC, ReactElement } from 'react'
import { useAppSelector } from 'store'
import { formatMoney } from 'shared/helpers/format'
import { formatDate } from 'shared/helpers/date'
import { getTotalsByMonth, MonthTotals } from '../selectors'
import { getUserCurrencyCode } from 'models/instrument'
import {
  Typography,
  ButtonBase,
  Box,
  Divider,
  useMediaQuery,
  ButtonBaseProps,
  Theme,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import { Tooltip } from 'shared/ui/Tooltip'
import Rhythm from 'shared/ui/Rhythm'
import { useMonth } from '../model'
import { Amount } from 'components/Amount'
import { TDateDraft } from 'shared/types'
import { keys } from 'shared/helpers/keys'
import { getMonthTotals } from 'models/envelopeData'

type TColor = 'error' | 'warning' | 'success'

const useStyles = makeStyles<Theme, { color: TColor }>(
  ({ shape, spacing, palette, breakpoints }) => ({
    base: {
      display: 'flex',
      flexDirection: 'column',
      borderRadius: shape.borderRadius,
      padding: spacing(1.5, 2),
      background: ({ color }) =>
        `linear-gradient(105deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 100%
        ),${palette[color].main}`,
      boxShadow: ({ color }) => `0 8px 20px -12px ${palette[color].main}`,
      transition: '0.4s',
      color: ({ color }) => palette.getContrastText(palette[color].main),

      [breakpoints.down('xs')]: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
      },
    },
    small: { padding: spacing(1, 2) },
    label: { minWidth: 0 },
  })
)

const getMonthName = (date: TDateDraft) =>
  formatDate(new Date(date), 'LLL').toLowerCase()

type ToBeBudgetedProps = ButtonBaseProps & {
  small?: boolean
}
export const ToBeBudgeted: FC<ToBeBudgetedProps> = props => {
  const { small, className, ...rest } = props
  const [month] = useMonth()
  const currency = useAppSelector(getUserCurrencyCode)
  const totals2 = useAppSelector(getMonthTotals)[month]
  const totalsByMonth = useAppSelector(getTotalsByMonth)
  const firstMonth = keys(totalsByMonth).sort()[0]
  const isFirstMonth = month === firstMonth
  const totals = totalsByMonth[month]
  const { toBeBudgeted, overspent, realBudgetedInFuture, budgetedInFuture } =
    totals
  const color: TColor =
    toBeBudgeted < 0 ? 'error' : overspent ? 'warning' : 'success'
  const hasFutureOverspend = realBudgetedInFuture > budgetedInFuture
  const c = useStyles({ color })
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))

  const BigWidget = (
    <ButtonBase className={`${c.base} ${className}`} {...rest}>
      <Typography noWrap align="center" variant={isMobile ? 'body1' : 'h5'}>
        {toBeBudgeted ? (
          <Amount
            value={totals2.toBeBudgeted}
            currency={currency}
            decMode="ifAny"
            noShade
          />
        ) : hasFutureOverspend ? (
          '👍'
        ) : (
          '👌'
        )}
      </Typography>
      <Typography
        noWrap
        align="center"
        variant={isMobile ? 'body1' : 'body2'}
        className={c.label}
      >
        {toBeBudgeted ? 'Не распределено' : 'Деньги распределены'}
      </Typography>
    </ButtonBase>
  )

  const SmallWidget = (
    <ButtonBase className={`${c.base} ${c.small} ${className}`} {...rest}>
      <Typography noWrap align="center" variant="body1">
        {toBeBudgeted ? (
          <Amount
            value={toBeBudgeted}
            currency={currency}
            decMode="ifAny"
            noShade
          />
        ) : hasFutureOverspend ? (
          '👍'
        ) : (
          '👌'
        )}
      </Typography>
    </ButtonBase>
  )

  return (
    <TotalsTooltip color={color} {...{ currency, totals, isFirstMonth }}>
      {small ? SmallWidget : BigWidget}
    </TotalsTooltip>
  )
}

type TotalsTooltipProps = {
  currency: string
  color: TColor
  totals: MonthTotals
  isFirstMonth: boolean
  children: ReactElement
}
const TotalsTooltip: FC<TotalsTooltipProps> = ({
  currency,
  color,
  totals,
  isFirstMonth,
  children,
}) => {
  const {
    date,
    prevOverspent,
    toBeBudgeted,
    overspent,
    income,
    prevFunds,
    transferOutcome,
    transferFees,
    // realBudgetedInFuture,
    budgeted,
    budgetedInFuture,
  } = totals
  const formatSum = (sum: number) => formatMoney(sum, currency)

  const messages = {
    success: toBeBudgeted
      ? `Распределите деньги по категориям в этом или следующем месяце.`
      : `Все деньги распределены по категориям, так держать 🥳`,
    warning: `Перерасход в категориях ${formatSum(
      overspent
    )}. Добавьте денег в категории с перерасходом.`,
    error: `Вы распределили больше денег, чем у вас есть. Из каких-то категорий придётся забрать деньги.`,
  }

  const Line: FC<{ name: string; amount: number }> = props => {
    const { name, amount } = props
    return (
      <Box display="flex" flexDirection="row">
        <Typography
          noWrap
          variant="caption"
          sx={{ flexGrow: 1, mr: 1, minWidth: 0 }}
        >
          {name}
        </Typography>

        <Typography variant="caption">
          {amount > 0 && '+'}
          {formatSum(amount)}
        </Typography>
      </Box>
    )
  }

  function TooltipContent() {
    return (
      <Rhythm gap={1}>
        <Typography variant="body2" align="center">
          {messages[color]}
        </Typography>
        <Divider />
        {isFirstMonth ? (
          <Line name="Начальный остаток на счетах" amount={prevFunds} />
        ) : (
          <>
            <Line name="Остаток с прошлого месяца" amount={prevFunds} />
            <Line name="Перерасход в прошлом месяце" amount={-prevOverspent} />
          </>
        )}
        <Line name={`Доход за ${getMonthName(date)}`} amount={income} />
        <Line name={`Бюджеты на ${getMonthName(date)}`} amount={-budgeted} />
        <Line
          name="Переводы без категории"
          amount={-transferOutcome - transferFees}
        />
        <Line name="Распределено в будущем" amount={-budgetedInFuture} />
      </Rhythm>
    )
  }

  return (
    <Tooltip arrow title={<TooltipContent />}>
      {children}
    </Tooltip>
  )
}
