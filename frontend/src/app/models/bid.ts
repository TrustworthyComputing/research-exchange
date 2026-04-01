export enum BidStatus {
  WINNING,
  LOSING,
  WON,
  LOST,
  CANCELLED
}

export interface Bid {
  uid: number
  task_uid: number
  author: string
  status: BidStatus
  created_date: Date
  task_title: string
  amount: number
  cancelled: boolean
  cancel_requested: boolean,
  is_lowest: boolean,
  is_winner: boolean,
  is_cancellable: boolean,
  is_payable: boolean,
}
