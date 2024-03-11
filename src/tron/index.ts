import { providers, TronWeb } from "tronweb"
import { EVM_MNEMONIC } from "../utils/constants"

const HttpProvider = TronWeb.providers.HttpProvider;

export default class Wallet {
    private path = "m/44'/195'/0'/0"
    tronWeb: any
    private phrase = EVM_MNEMONIC

    constructor(){
        const node = new HttpProvider("https://api.trongrid.io")
        this.tronWeb = new TronWeb(node, node, node, privateKey);
        this.tronWeb.setHeader({"TRON-PRO-API-KEY": 'your api key'});
    }

    private getAddress(index: number) {
        const { privateKey, address } = this.tronWeb.fromMnemonic(this.phrase, `${this.path}/${index}`)
    
        return { address, privateKey };
    }

}