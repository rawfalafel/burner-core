const Web3 = require('web3');
const cookies = require('../lib/cookies');
const Signer = require('./Signer');

class LocalSigner extends Signer {
  constructor({ privateKey, saveKey=true } = {}) {
    super();
    this.web3 = new Web3();
    this._saveKey = saveKey;

    if (this._isValidPK(privateKey)) {
      this._generateAccountFromPK(privateKey);
    } else {
      this._loadOrGenerateAccount();
    }
  }

  getAccounts() {
    return [this.account.address];
  }

  hasAccount(account) {
    return this.account.address.toLowerCase() === account.toLowerCase();
  }

  async signTx(tx) {
    const { rawTransaction } = await this.account.signTransaction(tx);
    return rawTransaction;
  }

  permissions() {
    return ['readKey', 'writeKey', 'burn'];
  }

  invoke(action, account, ...params) {
    if (!this.hasAccount(account)) {
      throw new Error('Can not call invoke, incorrect account');
    }

    switch (action) {
      case 'readKey':
        return this.account.privateKey;
      case 'writeKey':
        const [newPK] = params;
        this._generateAccountFromPK(newPK);
        return this.account.address;
      case 'burn':
        this._generateNewAccount();
        return this.account.address;
      default:
        throw new Error(`Unknown action ${action}`);
    }
  }

  _isValidPK(pk) {
    return !!pk && parseInt(pk) > 0;
  }

  _loadOrGenerateAccount() {
    const pk = (window.localStorage && localStorage.getItem('metaPrivateKey'))
      || cookies.getCookie('metaPrivateKey');
    if (this._isValidPK(pk)) {
      this._generateAccountFromPK(pk);
    } else {
      this._generateNewAccount();
    }
  }

  _generateAccountFromPK(privateKey) {
    this.account = (new Web3()).eth.accounts.privateKeyToAccount(privateKey);
    this._saveAccount();
  }

  _generateNewAccount() {
    this.account = (new Web3()).eth.accounts.create();
    this._saveAccount();
  }

  _saveAccount() {
    if (!this.saveKey) {
      return;
    }

    if (window.localStorage) {
      localStorage.setItem('metaPrivateKey', this.account.privateKey);
    }
    cookies.setCookie('metaPrivateKey', this.account.privateKey);
  }
}

module.exports = LocalSigner;