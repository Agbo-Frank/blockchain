import axios from 'axios';
import {mnemonicToSeedSync} from 'bip39';
import { networks, payments } from 'bitcoinjs-lib';
import bitcore from 'bitcore-lib';
import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';
import BigNumber from 'bignumber.js';
import { ITransfer } from './interface';
import { BITCOIN_MNEMONIC } from '../utils/constants';

const bip32 = BIP32Factory(ecc);
const IS_TESTNET = true

axios.defaults.baseURL = `https://blockstream.info/${IS_TESTNET ? "testnet/api" : "api"}`;

export default class UTXOWallet {
  private mnemonic: string;
  private seed: Buffer;
  private root: any;
  private network: any;

  constructor() {
    this.mnemonic = BITCOIN_MNEMONIC;
    this.seed = mnemonicToSeedSync(this.mnemonic);
    this.root = bip32.fromSeed(this.seed);
    this.network = IS_TESTNET ? networks.testnet : networks.bitcoin;
  }

  private getPath(index: number): string {
    return `m/44'/${IS_TESTNET ? 1 : 0}'/0'/0/${index}`;
  }

  private async getUtxos(address: string): Promise<any> {
    const response = await axios.get(`/address/${address}/utxo`);
    return response.data;
  }

  private async getOptimalFee(): Promise<number> {
    const response = await axios.get("https://bitcoinfees.net/api.json");
    return response.data.fee_by_block_target['1'] || 10000;
  }

  private _getAddress(index: number): { address: string, privateKey: string } {
    const path = this.getPath(index);
    const child = this.root.derivePath(path);

    const { address } = payments.p2sh({
      redeem: payments.p2wpkh({
        pubkey: child.publicKey,
        network: this.network,
      }),
      network: this.network,
    })

    return { address, privateKey: child.toWIF() };
  }

  private async _transfer(recipient: string, amount: number, index: number): Promise<string> {
    try {
      const btcAmount = new BigNumber(amount);
      const satoshiToSend = btcAmount.multipliedBy(new BigNumber(10).exponentiatedBy(8)).toNumber();
      const { address, privateKey } = this._getAddress(index);
      const fee = await this.getOptimalFee();

      const utxos = await this.getUtxos(address);
      //@ts-ignore
      const scriptPubKey = bitcore.Script.buildScriptHashOut(bitcore.Address.fromString(address)).toHex();

      let inputs: any[] = [];
      let totalAmountAvailable = 0;

      for (const item of utxos) {
        let utxo:any = {};

        utxo.satoshis = Number(item.value);
        utxo.script = scriptPubKey;
        utxo.address = address;
        utxo.txId = item.txid;
        utxo.outputIndex = item.vout;

        totalAmountAvailable += utxo.satoshis;

        inputs.push(utxo);
      }

      if (totalAmountAvailable < satoshiToSend + fee) {
        throw new Error("Insufficient funds");
      }

      const tx = new bitcore.Transaction();
      tx.from(inputs);
      tx.to(recipient, satoshiToSend);
      tx.fee(Math.round(fee));
      tx.change(address);
      //@ts-ignore
      tx.sign(bitcore.PrivateKey.fromWIF(privateKey));

      const _tx = tx.serialize();
      const result = await axios.post('/tx', _tx);
      const hash = result.data;

      return hash;
    } catch (error) {
      console.log('Error during the transfer', {error});
      return '';
    }
  }

  public async _getBalance(index: number): Promise<number> {
    const { address } = this._getAddress(index);

    try {
      const utxos = await this.getUtxos(address);
      const bn = utxos.reduce((sum: BigNumber, utxo: any) => sum.plus(utxo.value), new BigNumber(0)).dividedBy(new BigNumber(10).exponentiatedBy(8));

      return bn.toNumber();
    } catch (error) {
      console.log('Error fetching balance', {error});
      return 0;
    }
  }

  public getAddress(indexes: number[]): string[] {
    const addresses: string[] = [];
  
    for (let i = 0; i < indexes.length; i++) {
      const { address } = this._getAddress(indexes[i]);
      addresses.push(address);
    }
  
    return addresses;
  }

  public async transfer(payload: ITransfer): Promise<string[]> {
    const {indexes, recipients, amounts} = payload;
    const promises: Promise<string>[] = [];
  
    for (let i = 0; i < recipients.length; i++) {
      promises.push(this._transfer(recipients[i], amounts[i], indexes[i]));
    }
  
    try {
      const hashes = await Promise.all(promises);
      return hashes;
    } catch (error) {
      console.log('Error during the transfer', {error});
      return [];
    }
  }

  public async getBalance(indexes: number[]): Promise<number[]> {
    const promises: Promise<number>[] = [];
  
    for (let i = 0; i < indexes.length; i++) {
      promises.push(this._getBalance(indexes[i]));
    }
  
    try {
      const balances = await Promise.all(promises);
      return balances;
    } catch (error) {
      console.log('Error during get balance', {error});
      return [];
    }
  }
}