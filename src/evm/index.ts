import { Alchemy, BigNumber, Network, Utils, Wallet, Contract, TransactionRequest } from "alchemy-sdk";
import { ALCHEMY_API_KEY, ERC20_ABI, EVM_MNEMONIC, PRIVATE_KEY } from "../utils/constants";
import { IEstimateGas, ITransfer } from "./interface";
import { HDNodeWallet, ethers} from "ethers";

export default class EVM {
    private api_key = "tGQ57DwrJPSg_zx6mRAuUJiZiR6DwOo8"
    private path = "m/44'/60'/0'/0"
    private phrase = EVM_MNEMONIC
    root: HDNodeWallet
    private alchemy: Alchemy

    constructor(network?: Network){
        this.alchemy = new Alchemy({ apiKey: this.api_key, network})
        this.root = ethers.HDNodeWallet.fromPhrase(this.phrase, undefined, this.path)
    }

    async getBalance(address: string, token_address?: string[]){
        try {
            const { tokenBalances } = await this.alchemy.core.getTokenBalances(address, token_address);

            return tokenBalances.map(item => ({
                ...item, 
                tokenBalance: Utils.formatUnits(BigNumber.from(item.tokenBalance))
            }))
        } catch (error) {
            throw new Error("Unable to get balance: " + error)
        }
    }

    private getAddress(index: number) {
        const { privateKey, address } = Wallet.fromMnemonic(this.phrase, `${this.path}/${index}`)
    
        return { address, privateKey };
    }

    private getContract(address: string, abi: any, private_key?: string){
        const signer = new Wallet(private_key, this.alchemy)
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

            const { privateKey} = this.getAddress(payload?.index)
            
            const { contract, signer } = this.getContract(token_address, ERC20_ABI, privateKey)
            
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
          await txResponse.wait()
    
          return txResponse.hash;
        } catch (error) {
            throw error;
        }
    }
}