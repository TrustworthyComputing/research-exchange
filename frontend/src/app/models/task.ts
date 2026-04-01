import {Bid} from "./bid";

export enum CurrencyCode {
  USD = "USD"
}

export enum TaskStatus {
  ACCEPTING_BIDS,
  PENDING_COMPLETION,
  COMPLETED,
  CANCELLED,
}

export interface Task {
  id: number
  author: string
  title: string
  description: string
  start_bid_amount: number
  current_bid: number
  total_bids: number
  end_bid_date: Date,
  end_date: Date,
  status: TaskStatus,
  is_editable: boolean,
  is_cancellable: boolean,
  is_completeable: boolean,
  is_biddable: boolean,
  user_bid: Bid
  finalized: boolean
}

export interface CreateTask {
  title?: string | null
  description?: string | null
  start_bid_amount?: number | null
  end_bid_date?: Date | null
  end_date?: Date | null
}

export interface RequestEditTask {
  title: string,
  description: string
}
