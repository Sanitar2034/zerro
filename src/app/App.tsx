import React, { FC, useEffect, useState } from 'react'
import { Router, Route, Redirect, Switch } from 'react-router-dom'
import { createBrowserHistory } from 'history'
import {
  Box,
  CircularProgress,
  Typography,
  useMediaQuery,
  Theme,
} from '@mui/material'
import { initTracking, setUserId } from '@shared/helpers/tracking'
import { useAppSelector } from '@store'
import { getLoginState } from '@store/token'
import { getLastSyncTime } from '@store/data/selectors'
import { RegularSyncHandler } from '@components/RegularSyncHandler'
import Nav from '@components/Navigation'
import { MobileNavigation } from '@components/Navigation'
import ErrorBoundary from '@components/ErrorBoundary'
import { getRootUser } from '@entities/user'
import Transactions from '@pages/Transactions'
import Auth from '@pages/Auth'
import BudgetsOld from '@pages/BudgetsOld'
import Budgets from '@pages/Budgets'
import Review from '@pages/Review'
import Accounts from '@pages/Accounts'
import Stats from '@pages/Stats'
import About from '@pages/About'
import Token from '@pages/Token'
import Donation from '@pages/Donation'

const history = createBrowserHistory()
initTracking(history)

export default function App() {
  const isLoggedIn = useAppSelector(getLoginState)
  const hasData = useAppSelector(state => !!getLastSyncTime(state))
  const userId = useAppSelector(state => getRootUser(state)?.id)
  useEffect(() => {
    if (typeof userId === 'number') setUserId(userId)
  }, [userId])

  const publicRoutes = (
    <>
      <Route path="/about" component={About} />
      <Route path="/about/*" component={About} />
      <Route path="/donation" component={Donation} />
    </>
  )

  const notLoggedIn = (
    <>
      {publicRoutes}
      <Route path="/*" component={Auth} />
    </>
  )

  const loggedInNoData = (
    <>
      {publicRoutes}
      <Route path="/token" component={Token} />
      <Route path="/*" component={MainLoader} />
    </>
  )

  const loggedInWithData = (
    <>
      {publicRoutes}
      <Route path="/token" component={Token} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/review" component={Review} />
      <Route path="/accounts" component={Accounts} />
      <Route path="/budget-old" component={BudgetsOld} />
      <Route path="/budget" component={Budgets} />
      <Route path="/stats" component={Stats} />
      <Redirect to="/budget" />
    </>
  )

  return (
    <Router history={history}>
      <RegularSyncHandler />
      <Layout isLoggedIn={isLoggedIn}>
        <ErrorBoundary>
          <Switch>
            {isLoggedIn
              ? hasData
                ? loggedInWithData
                : loggedInNoData
              : notLoggedIn}
          </Switch>
        </ErrorBoundary>
      </Layout>
    </Router>
  )
}

type TLayoutProps = {
  isLoggedIn: boolean
  children: React.ReactNode
}

const Layout: FC<TLayoutProps> = ({ isLoggedIn, children }) => {
  return (
    <Box display="flex">
      {isLoggedIn && <Navigation />}
      <Box minHeight="100vh" flexGrow={1}>
        {children}
      </Box>
    </Box>
  )
}

const Navigation = React.memo(() => {
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'))
  return isMobile ? <MobileNavigation /> : <Nav />
})

const hints = [
  { hint: 'Первая загрузка самая долгая 😅', delay: 5000 },
  { hint: 'Всё зависит от интернета и количества операций 🤞', delay: 10000 },
  { hint: 'Может всё-таки загрузится? 🤔', delay: 30000 },
  { hint: 'Что-то долго, попробуйте перезагрузить страницу 🤪', delay: 45000 },
]

function MainLoader() {
  const [hint, setHint] = useState('Загружаемся... 🖤')

  useEffect(() => {
    const timers = hints.map(({ hint, delay }) =>
      setTimeout(() => setHint(hint), delay)
    )
    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [])
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
    >
      <CircularProgress />
      <Box mt={4} width="200">
        <Typography align="center">{hint}</Typography>
      </Box>
    </Box>
  )
}
