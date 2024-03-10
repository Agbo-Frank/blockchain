import { Token } from "@uniswap/sdk-core"
import { FeeAmount, computePoolAddress } from "@uniswap/v3-sdk"

export default class Swap {
    
    getPoolAddress(){
        const tokenIn = new Token(1,'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',18,'WETH','Wrapped Ether')
        const tokenOut = new Token(1,'0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6,'USDC','USD//C')

        const currentPoolAddress = computePoolAddress({
            factoryAddress: "POOL_FACTORY_CONTRACT_ADDRESS",
            tokenA: tokenIn,
            tokenB: tokenOut,
            fee: FeeAmount.MEDIUM,
        })
    }
}