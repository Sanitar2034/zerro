import React from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'
import debounce from 'lodash/debounce'
import { Table } from 'antd'
import { formatMoney } from 'helpers/format'
import { setOutcomeBudget } from '../../thunks'
import BudgetCell from './BudgetCell'
import { getAmountsByTag } from '../../selectors/getAmountsByTag'
import { getUserCurrencyCode } from 'store/data/instruments'
import Row from './Row'

const colorMap = {
  positive: 'var(--text-success)',
  negative: 'var(--color-danger)',
  neutral: 'var(--text-placeholder)',
}

const Available = styled.span`
  color: ${props => colorMap[props.displayType]};
`
const Outcome = styled.span`
  color: ${props =>
    props.value === 0 ? 'var(--text-placeholder)' : 'var(--text-primary)'};
`

function TagTable({ tags, currency, date, updateBudget, ...rest }) {
  const formatSum = sum => formatMoney(sum, currency)

  const columns = [
    {
      title: 'Категория',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Бюджет',
      dataIndex: 'budgeted',
      key: 'budgeted',
      align: 'right',
      render: ({
        budgeted,
        available,
        id,
        date,
        updateBudget,
        isChild = false,
      }) => (
        <BudgetCell
          id={id}
          budgeted={budgeted}
          available={available}
          key={id + budgeted}
          date={date}
          isChild={isChild}
          onUpdate={debounce(updateBudget, 2000)}
        />
      ),
    },
    {
      title: 'Потрачено',
      dataIndex: 'outcome',
      key: 'outcome',
      align: 'right',
      render: value => <Outcome value={value}>{formatSum(value)}</Outcome>,
    },
    {
      title: 'Остаток',
      dataIndex: 'available',
      key: 'available',
      align: 'right',
      render: props => (
        <Available displayType={getAvailableColor(props)}>
          {formatSum(props.value)}
        </Available>
      ),
    },
  ]

  const tableData = tags
    .filter(tag => tag.showOutcome || tag.totalOutcome || tag.totalAvailable)
    .map(tag => {
      const hasOverspent = !!tag.overspent

      return {
        key: tag.id + '',
        name: tag.title,
        budgeted: {
          date,
          updateBudget,
          tag,
          id: tag.id,
          budgeted: tag.totalBudgeted,
          available: tag.totalAvailable,
          isChild: false,
        },
        available: { value: tag.totalAvailable, hasOverspent, isChild: false },
        outcome: tag.totalOutcome,

        children: getChildren({ tag, date, updateBudget, hasOverspent }),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      {tags.map(tag => (
        <Row key={tag.id} {...tag} setBudget={updateBudget} date={date}></Row>
      ))}
      <Table
        size="small"
        columns={columns}
        dataSource={tableData}
        defaultExpandAllRows={false}
        indentSize={56}
        pagination={false}
        {...rest}
      />
    </div>
  )
}

const mapStateToProps = (state, { index }) => ({
  tags: getAmountsByTag(state)[index],
  currency: getUserCurrencyCode(state),
})

const mapDispatchToProps = dispatch => ({
  updateBudget: (outcome, month, tagId) =>
    dispatch(setOutcomeBudget(outcome, month, tagId)),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TagTable)

function getAvailableColor({ value, hasOverspent, isChild, hasBudget }) {
  if (!isChild || hasBudget) {
    return value === 0 ? 'neutral' : value < 0 ? 'negative' : 'positive'
  } else {
    return value > 0
      ? 'positive'
      : value === 0
      ? 'neutral'
      : hasOverspent
      ? 'negative'
      : 'neutral'
  }
}

function getChildren({ tag, date, updateBudget, hasOverspent }) {
  const children = tag.children.length
    ? tag.children
        .filter(
          child =>
            child.showOutcome || child.totalOutcome || child.totalAvailable
        )
        .map(child => ({
          key: child.id,
          name: child.title,
          budgeted: {
            date,
            updateBudget,
            tag,
            id: child.id,
            budgeted: child.budgeted,
            available: child.available,
            isChild: true,
          },
          available: {
            value: child.available,
            hasOverspent,
            isChild: true,
            hasBudget: !!child.budgeted,
          },
          outcome: child.outcome,
        }))
    : null
  return children && tag.outcome
    ? [
        {
          key: tag.id + '-unsorted',
          name: 'Без подкатегории',
          budgeted: {
            updateBudget: () => {},
            date,
            id: tag.id,
            budgeted: 0,
            available: 0,
            isChild: true,
          },
          available: {
            value: -tag.outcome,
            hasOverspent,
            isChild: true,
            hasBudget: false,
          },
          outcome: tag.outcome,
        },
        ...children,
      ]
    : children
}
