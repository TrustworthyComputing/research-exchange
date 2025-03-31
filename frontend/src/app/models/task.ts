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
  start_bid_currency_code: CurrencyCode
  start_bid_amount: number
  current_bid: number
  total_bids: number
  end_bid_date: Date,
  end_date: Date,
  status: TaskStatus
}

export interface CreateTask {
  title?: string | null
  description?: string | null
  start_bid_amount?: number | null
  end_bid_date?: Date | null
  end_date?: Date | null
}
