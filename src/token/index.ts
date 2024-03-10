import { Alchemy, BigNumber, Network, Utils, Wallet, Contract, TransactionRequest } from "alchemy-sdk";
import { ALCHEMY_API_KEY, ERC20_ABI, PRIVATE_KEY } from "../utils/constants";
import { IEstimateGas, ITransfer } from "./interface";
import { HDNodeWallet, ethers} from "ethers";
import { Token } from "@uniswap/sdk-core"
import { FeeAmount, computePoolAddress } from "@uniswap/v3-sdk"
import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'

export default class EVM {
    private api_key = "tGQ57DwrJPSg_zx6mRAuUJiZiR6DwOo8"
    private private_key: string
    private path = "m/44'/60'/0'/0"
    private phrase = "major type protect noble dove obtain solution cricket worry churn indicate wrestle"
    private root: HDNodeWallet
    private alchemy: Alchemy

    constructor(network?: Network){
        this.alchemy = new Alchemy({ apiKey: this.api_key, network})
        this.root = ethers.HDNodeWallet.fromPhrase(this.phrase, undefined, this.path)
        this.private_key = Wallet.fromMnemonic(this.phrase).privateKey
    }

    async getBalance(_address: string, _token_address?: string[]){
        try {
            const { tokenBalances } = await this.alchemy.core.getTokenBalances(_address, _token_address);
            const { tokenBalance, contractAddress } = tokenBalances[0]

            const { decimals, name, logo, symbol } = await this.alchemy.core.getTokenMetadata(contractAddress)
            const balance = Utils.formatUnits(BigNumber.from(tokenBalance), Number(decimals))

            return {
                token_name: `${name} (${symbol})`,
                balance,
            }
        } catch (error) {
            throw new Error("Unable to get balance: " + error)
        }
    }

    private getContract(address: string, abi: any){
        const signer = new Wallet(String(this.private_key), this.alchemy)
        const contract = new Contract(address, abi, signer)
        
        return { contract, signer }
    }

    async estimateGas(payload: IEstimateGas){
        try {
            const { token_address, amount, recipent } = payload
            const { contract } = this.getContract(token_address, ERC20_ABI)
            const response =  await contract.estimateGas.transfer(recipent, Utils.parseUnits(amount))

            return BigNumber.from(response).toString()
        } catch (error: any) {
            console.log("response:", error?.response)
            throw error
        }
    }

    async transfer(payload: ITransfer){
        try {
            const { token_address, amount, recipent } = payload
            const { contract, signer } = this.getContract(token_address, ERC20_ABI)
            
            const tx =  await contract.populateTransaction.transfer(recipent, Utils.parseUnits(amount))
            if(!tx) throw new Error("Unable to populate transaction")

            return this.sendTransaction(tx, signer)
            
        } catch (error: any) {
            return error
        }
    }

    private async sendTransaction(txRequest: TransactionRequest, signer: Wallet) {
        try {
    
          let estimatedGas = await signer.estimateGas(txRequest);
          if (estimatedGas) txRequest.gasLimit = estimatedGas;
    
          const txResponse = await signer.sendTransaction(txRequest);
          const hash = txResponse.hash;
    
          return hash;
        } catch (error) {
            throw error;
        }
    }

    async getPoolAddress(){
        const tokenIn = new Token(11155111,'0x6D2B5c68F1506d4dCB49320D7D9Cc7e8375aC1d0', 18,'FRANK','Frank') //FRANK
        const tokenOut = new Token(11155111,'0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', 18,'WETH','Wrapped Ether')

        console.log("tokenIn: ", tokenIn)
        console.log("tokenOut: ", tokenOut)

        const currentPoolAddress = computePoolAddress({
            factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
            tokenA: tokenIn,
            tokenB: tokenOut,
            fee: FeeAmount.MEDIUM,
        })

        console.log("currentPoolAddress: ", currentPoolAddress)

        const { contract } = this.getContract(currentPoolAddress, IUniswapV3PoolABI.abi)
        // console.log(contract)

        // const token0 = await contract.callStatic.token0()
        // console.log(token0)
        // const token1 = await contract.token1()
        // console.log(token1)
        const fee = await contract.callStatic.fee()
        console.log(fee)

        // const { contract: quoterContract } = this.getContract("0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6", Quoter.abi)
        // const amountOut = await quoterContract.callStatic.quoteExactInputSingle(
        //     token0,
        //     token1,
        //     fee,
        //     Utils.parseUnits("90", 18).toString(),
        //     0
        // )

        // return amountOut
    }
}