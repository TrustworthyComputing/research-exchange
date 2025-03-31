export enum BidStatus {
  WINNING,
  LOSING,
  WON,
  LOST,
  CANCELLED
}

export interface Bid {
  id: number
  task: number
  author: string
  status: BidStatus
  created_date: Date
  task_name: string
  amount: number
  cancelled: boolean
  cancel_requested: boolean
}
