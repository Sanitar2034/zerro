import React, { useState, useRef, useCallback, FC } from 'react'

import add from 'date-fns/add'
import sub from 'date-fns/sub'
import {
  Box,
  Paper,
  Typography,
  IconButton,
  ButtonBase,
  PaperProps,
} from '@mui/material'
import { ChevronRightIcon, ChevronLeftIcon } from 'shared/ui/Icons'
import { styled } from '@mui/styles'
import MonthSelectPopover from './MonthSelectPopover'
import { formatDate } from 'shared/helpers/format'
import { Modify, TDateDraft, TISOMonth } from 'shared/types'
import { toISOMonth } from 'shared/helpers/adapterUtils'

type MonthSelectProps = Modify<
  PaperProps,
  {
    onChange: (month: TISOMonth) => void
    minMonth: TDateDraft
    maxMonth: TDateDraft
    value: TDateDraft
  }
>

export const MonthSelect: FC<MonthSelectProps> = props => {
  const { onChange, minMonth, maxMonth, value, ...rest } = props
  const currDate = new Date(value)
  const minDate = new Date(minMonth)
  const maxDate = new Date(maxMonth)
  const paperRef = useRef(null)
  const year = currDate.getFullYear()
  const [anchorEl, setAnchorEl] = useState(null)
  const prevMonth = currDate > minDate ? sub(currDate, { months: 1 }) : null
  const nextMonth = currDate < maxDate ? add(currDate, { months: 1 }) : null

  const openPopover = useCallback(
    () => setAnchorEl(paperRef.current),
    [setAnchorEl]
  )
  const closePopover = useCallback(() => setAnchorEl(null), [setAnchorEl])
  const handleChange = useCallback(
    (date: TISOMonth) => {
      closePopover()
      onChange(date)
    },
    [closePopover, onChange]
  )

  return (
    <>
      <Paper ref={paperRef} {...rest}>
        <Box display="flex" px={0.5} py={1}>
          <Box alignSelf="center" flexShrink={0}>
            <IconButton
              children={<ChevronLeftIcon />}
              onClick={() => prevMonth && onChange(toISOMonth(prevMonth))}
              disabled={!prevMonth}
            />
          </Box>

          <MonthButton onClick={openPopover}>
            <Typography variant="h5" noWrap>
              {getMonthName(currDate)}
            </Typography>
            <Typography variant="body2" color="textSecondary" noWrap>
              {year}
            </Typography>
          </MonthButton>

          <Box alignSelf="center" flexShrink={0}>
            <IconButton
              children={<ChevronRightIcon />}
              onClick={() => nextMonth && onChange(toISOMonth(nextMonth))}
              disabled={!nextMonth}
            />
          </Box>
        </Box>
      </Paper>

      <MonthSelectPopover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={closePopover}
        value={value}
        minMonth={minMonth}
        maxMonth={maxMonth}
        onChange={handleChange}
      />
    </>
  )
}

const MonthButton = styled(ButtonBase)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  flexGrow: 1,
  flexShrink: 1,
  minWidth: 0,
  padding: theme.spacing(0.5, 1),
  justifyContent: 'flex-start',
  display: 'flex',
  flexDirection: 'column',
}))

function getMonthName(month: number | Date) {
  // const isCurrentYear =
  //   new Date().getFullYear() === new Date(month).getFullYear()
  // const pattern = isCurrentYear ? 'LLLL' : 'LLLL yyyy'
  // return formatDate(month, pattern).toUpperCase()
  return formatDate(month, 'LLLL').toUpperCase()
}
