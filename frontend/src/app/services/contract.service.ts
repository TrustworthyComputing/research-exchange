import {Injectable, NgZone} from '@angular/core';
import {ethers, BigNumberish} from "ethers";
import {HttpClient} from "@angular/common/http";
import {Bid} from "../models/bid";
import {API_URL} from "../constants";
import {NonceRequest, NonceResponse, VerifySignatureRequest} from "../models/wallet";
import {BehaviorSubject, firstValueFrom, lastValueFrom, Observable} from "rxjs";
import {add} from "ngx-bootstrap/chronos";

const contractAddress = '0xd05760a5d9ca414252EdAb18A2023b6A12F40dcA';
const abi = [{"inputs": [], "stateMutability": "nonpayable", "type": "constructor"}, {"anonymous": false, "inputs": [{"indexed": false, "internalType": "uint256", "name": "taskId", "type": "uint256"}, {"indexed": true, "internalType": "uint256", "name": "id", "type": "uint256"}], "name": "LogCancelBid", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "taskId", "type": "uint256"}], "name": "LogCancelTask", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "taskId", "type": "uint256"}], "name": "LogCompleteTask", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "taskId", "type": "uint256"}, {"indexed": false, "internalType": "string", "name": "title", "type": "string"}, {"indexed": false, "internalType": "string", "name": "description", "type": "string"}, {"indexed": true, "internalType": "address", "name": "owner", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "startAmount", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "bidEndDate", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "completeDate", "type": "uint256"}], "name": "LogCreateTask", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "id", "type": "uint256"}, {"indexed": true, "internalType": "uint256", "name": "taskId", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "date", "type": "uint256"}, {"indexed": true, "internalType": "address", "name": "owner", "type": "address"}], "name": "LogPlaceBid", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "taskId", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "startAmount", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "bidEndDate", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "completeDate", "type": "uint256"}], "name": "LogUpdateTask", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "oldOwner", "type": "address"}, {"indexed": true, "internalType": "address", "name": "newOwner", "type": "address"}], "name": "OwnerSet", "type": "event"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}, {"internalType": "uint256", "name": "bidId", "type": "uint256"}], "name": "cancelBid", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}], "name": "cancelTask", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}], "name": "changeOwner", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}], "name": "completeTask", "outputs": [], "stateMutability": "payable", "type": "function"}, {"inputs": [{"internalType": "string", "name": "title", "type": "string"}, {"internalType": "string", "name": "description", "type": "string"}, {"internalType": "uint256", "name": "bidEndDate", "type": "uint256"}, {"internalType": "uint256", "name": "completeDate", "type": "uint256"}], "name": "createTask", "outputs": [], "stateMutability": "payable", "type": "function"}, {"inputs": [], "name": "getOwner", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}, {"internalType": "uint256", "name": "bidAmount", "type": "uint256"}], "name": "placeBid", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}, {"internalType": "uint256", "name": "startAmount", "type": "uint256"}, {"internalType": "uint256", "name": "bidEndDate", "type": "uint256"}, {"internalType": "uint256", "name": "completeDate", "type": "uint256"}], "name": "updateTask", "outputs": [], "stateMutability": "nonpayable", "type": "function"}]
declare var window: any

@Injectable({
  providedIn: 'root'
})
export class ContractService {

  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private wallet_address = new BehaviorSubject<string | null>(null);
  private wallet_balance = new BehaviorSubject<string | undefined>(undefined);


  constructor(private http: HttpClient) {
    this.initializeProvider();
  }

  private async initializeProvider() {
    if (window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      if (this.signer && this.provider) {
        this.contract = new ethers.Contract(contractAddress, abi, this.signer);
      }
    } else {
      console.log('MetaMask or Web3 wallet not detected.');
    }
  }

  async connectWallet(): Promise<boolean> {
    if (!this.provider) return false;
    try {
      const accounts = await this.provider.send('eth_requestAccounts', []);
      const nonceResponse = await firstValueFrom(this.http.post<NonceResponse>(`${API_URL}/wallet/request_nonce/`, {
        address: accounts[0]
      }))

      const signature = await this.signer?.signMessage(nonceResponse.nonce);
      await firstValueFrom(this.http.post<void>(`${API_URL}/wallet/verify_signature/`, {
        address: accounts[0],
        signature: signature
      }))
      this.wallet_address.next(accounts[0]);

      // Fetch balance
      await this.updateBalance();

      // Listen for account changes
      (window as any).ethereum.on('accountsChanged', async (accounts: string[]) => {
        await this.updateBalance();
      });

      // Listen for network changes
      (window as any).ethereum.on('chainChanged', async () => {
        await this.updateBalance();
      });
      return true
    } catch (error) {
      console.log("Failed to connect to wallet", error);
      return false
    }
  }

  private async updateBalance(): Promise<void> {
    let address = this.wallet_address.getValue()
    if (!this.signer || !this.provider || !address) return;
    const balanceWei = await this.provider.getBalance(address);
    this.wallet_balance.next(balanceWei.toString());
  }

  getWalletAddress(): Observable<string | null> {
    return this.wallet_address
  }

  getWalletBalance(): Observable<string | undefined> {
    return this.wallet_balance
  }

  async createTask(title: string, description: string, start_bid_amount: number, bid_end_date: Date , complete_date: Date) {
    if (!this.wallet_address.getValue() && !await this.connectWallet()) {
      return false
    }

    const tx = await this.contract?.["createTask"](
      title,
      description,
      BigInt(Math.floor(bid_end_date.getTime() / 1000)),
      BigInt(Math.floor(complete_date.getTime() / 1000)),
      {
        value: BigInt(start_bid_amount)
      }
    )
    const receipt = await tx.wait();
    console.log('GasUsed:', receipt.gasUsed.toString())
    return true
  }

  async cancelTask(id: number) {
    if (!this.wallet_address.getValue() && !await this.connectWallet()) {
      return false
    }

    console.log("Cancelled:", id)
    const tx = await this.contract?.["cancelTask"](
      BigInt(id),
    )
    const receipt = await tx.wait();
    console.log('GasUsed:', receipt.gasUsed.toString())
    return true
  }

  async updateTask(taskId: number, start_bid_amount: number, bid_end_date: Date , complete_date: Date) {
    if (!this.wallet_address.getValue() && !await this.connectWallet()) {
      return false
    }

    const tx = await this.contract?.["updateTask"](
      BigInt(taskId),
      BigInt(start_bid_amount),
      BigInt(Math.floor(bid_end_date.getTime() / 1000)),
      BigInt(Math.floor(complete_date.getTime() / 1000))
    )
    const receipt = await tx.wait();
    console.log('GasUsed:', receipt.gasUsed.toString())
    return true
  }


  async placeBid(taskId: number, bidAmount: number) {
    if (!this.wallet_address.getValue() && !await this.connectWallet()) {
      return false
    }

    const tx = await this.contract?.["placeBid"](
      BigInt(taskId),
      BigInt(bidAmount)
    )
    const receipt = await tx.wait();
    console.log('GasUsed:', receipt.gasUsed.toString())
    return true
  }

  async cancelBid(taskId: number, bidId: number) {
    if (!this.wallet_address.getValue() && !await this.connectWallet()) {
      return false
    }

    const tx = await this.contract?.["cancelBid"](
      BigInt(taskId),
      BigInt(bidId)
    )
    const receipt = await tx.wait();
    console.log('GasUsed:', receipt.gasUsed.toString())
    return true
  }

  async completeTask(taskId: number) {
    if (!this.wallet_address.getValue() && !await this.connectWallet()) {
      return false
    }

    const tx = await this.contract?.["completeTask"](
      BigInt(taskId),
    )
    const receipt = await tx.wait();
    console.log('GasUsed:', receipt.gasUsed.toString())
    return true
  }
}
