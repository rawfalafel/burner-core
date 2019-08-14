const Asset = require('./Asset');
const IERC20abi = require('./abi/IERC20.json');

class ERC20Asset extends Asset {
  constructor({ address, abi=IERC20abi, type='erc20', ...params }) {
    super({ ...params, type });
    this.address = address;
    this.abi = abi;
    this._contract = null;
  }

  async getBalance(account) {
    const balance = await this.getContract().methods.balanceOf(account).call();
    return balance.toString();
  }

  getContract() {
    if (!this._contract) {
      const Contract = this.getWeb3().eth.Contract;
      this._contract = new Contract(this.abi, this.address);
    }
    return this._contract;
  }

  allowance(from, to) {
    return this.getContract().methods.allowance(from, to).call();
  }

  approve(from, to, value) {
    return this.getContract().methods.approve(to, value).send({ from });
  }

  async getTx(txHash) {
    const events = await this._getEventsFromTx(txHash);
    const [transferEvent] = events.filter(event => event.event === 'Transfer');

    return {
      assetName: this.name,
      from: transferEvent.returnValues.from,
      to: transferEvent.returnValues.to,
      value: transferEvent.returnValues.value.toString(),
      displayValue: this.getDisplayValue(transferEvent.returnValues.value.toString()),
      message: null,
    };
  }

  startWatchingAddress(address) {
    const sub = this.getContract().events.Transfer({ filter: { to: address }})
      .on('data', event => this.core.addHistoryEvent({
        asset: this.id,
        type: 'send',
        amount: event.returnValues.value.toString(),
        from: event.returnValues.from,
        to: event.returnValues.to,
        tx: event.transactionHash,
        timestamp: Date.now() / 1000,
      }))
      .on('error', err => console.error(err));
    return () => sub.unsubscribe();
  }

  async _getEventsFromTx(txHash) {
    const web3 = this.getWeb3();
    const { blockNumber } = await web3.eth.getTransactionReceipt(txHash);
    const events = await this.getContract().getPastEvents('allEvents', { fromBlock: blockNumber, toBlock: blockNumber });
    console.log(events);
    return events.filter(event => event.transactionHash === txHash);
  }

  async _send({ from, to, value }) {
    const receipt = await this.getContract().methods.transfer(to, value).send({ from });
    return {
      ...receipt,
      txHash: receipt.hash,
    };
  }
}

module.exports = ERC20Asset;
