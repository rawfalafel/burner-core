const { expect } = require('chai');
require('dotenv').config();
const BurnerCore = require('../src/BurnerCore');
const InjectedGateway = require('../src/gateways/InjectedGateway');
const { LocalSigner, InjectedSigner } = require('../src/signers');

describe('BurnerCore', () => {
  const TEST_PK = '0x2054d094925e481cb81db7aae12fd498c95c6d20e8f998b62cbccfc18d22d5c9';
  const TEST_PK_2 = '0xc95c6d20e8f998b2054d049862cbccfc18d22d5c994925e481cb81db7aae12fd';
  const TEST_TX = '0x7a9b44fdf6b1aa6289846dba45ad66c870a60380fc44f77f79bb80d9d173d492';
  const TEST_ACCOUNT = '0x82e1dd26775c36589ca39516b34f47cffc9066d1';
  const TEST_ACCOUNT_2 = '0x7501833200a6BC6052D6f42294fc85aE9db148eA';

  let core;

  afterEach(() => core && core.stop());

  describe('signer actions', () => {
    it('should get appropriate permissions from the LocalSigner', () => {
      core = new BurnerCore({
        signers: [new LocalSigner({ privateKey: TEST_PK, saveKey: false })],
        gateways: [new InjectedGateway()],
        historyOptions: { storeHistory: false },
      });

      expect(core.canCallSigner('readKey', 'invalidAccount')).to.be.false;
      expect(core.canCallSigner('invalidAction', TEST_ACCOUNT)).to.be.false;

      expect(core.canCallSigner('readKey', TEST_ACCOUNT)).to.be.true;
      expect(core.canCallSigner('writeKey', TEST_ACCOUNT)).to.be.true;
      expect(core.canCallSigner('burn', TEST_ACCOUNT)).to.be.true;
    });

    it('should invoke the signer correctly', () => {
      core = new BurnerCore({
        signers: [new LocalSigner({ privateKey: TEST_PK, saveKey: false })],
        gateways: [new InjectedGateway()],
        historyOptions: { storeHistory: false },
      });

      core.callSigner('writeKey', TEST_ACCOUNT, TEST_PK_2);

      const [newAccount] = core.getAccounts();
      expect(newAccount).to.be.equal(TEST_ACCOUNT_2);
    });
  });

  describe('MetaMask', () => {
    afterEach(() => {
      global.window = {};
    });

    it('should skip signing when metamask available', (done) => {
      global.window = {
        ethereum: {
          isMetaMask: true,
          networkVersion: '1',
          sendAsync({ method, params }, cb) {
            switch(method) {
              case 'eth_accounts':
                return cb(null, {result: [TEST_ACCOUNT]});
              case 'eth_blockNumber':
                return cb(null, {result: 1});
              case 'eth_gasPrice':
                return cb(null, {result: '0x10000000'});
              case 'eth_getBlockByNumber':
                return cb(null, { result: { author: '', number: 0 }});
              case 'eth_getTransactionCount':
                return cb(null, { result: 0 });
              case 'eth_estimateGas':
                return cb(null, { result: '0x10000000' });
              case 'eth_signTransaction':
                return done('Shouldn\'t sign transaction');
              case 'eth_sendTransaction':
                expect(params[0].from).to.equal(TEST_ACCOUNT);
                return done();
            }
          },
        },
      };

      core = new BurnerCore({
        signers: [new InjectedSigner()],
        gateways: [new InjectedGateway()],
        historyOptions: { storeHistory: false },
      });

      setTimeout(() => core.getWeb3('1').eth.sendTransaction({
        from: TEST_ACCOUNT,
        to: TEST_ACCOUNT_2,
        value: 1,
      }), 10);
    })
  });

  describe('history', () => {
    it('should read and write events from history', () => {
      core = new BurnerCore({
        signers: [new LocalSigner({ privateKey: TEST_PK, saveKey: false })],
        gateways: [new InjectedGateway()],
        historyOptions: { storeHistory: false },
      });
      const timestamp = Math.floor(Date.now() / 1000);

      const checkEvent = (event) => {
        expect(event.asset).to.equal('test');
        expect(event.type).to.equal('send');
        expect(event.value).to.equal('100');
        expect(event.from).to.equal(TEST_ACCOUNT);
        expect(event.to).to.equal(TEST_ACCOUNT_2);
        expect(event.tx).to.equal(TEST_TX);
        expect(event.timestamp).to.equal(timestamp);
      };

      let gotCallback = false
      core.onHistoryEvent(event => {
        checkEvent(event);
        gotCallback = true;
      });

      core.addHistoryEvent({
        asset: 'test',
        type: 'send',
        value: '100',
        from: TEST_ACCOUNT,
        to: TEST_ACCOUNT_2,
        tx: TEST_TX,
        timestamp,
      });
      expect(gotCallback).to.be.true;

      const events = core.getHistoryEvents();
      expect(events.length).to.equal(1);
      checkEvent(events[0]);
    });
  });
});
