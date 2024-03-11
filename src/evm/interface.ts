export interface IEstimateGas {
    token_address: string
    recipent: string
    amount: string
}

export interface ITransfer {
    token_address: string
    recipent: string
    amount: string
    index?: number
}