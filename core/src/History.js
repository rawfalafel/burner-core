const HistoryEvent = require('./HistoryEvent');

const STORAGE_KEY = 'burner-history';

class History {
  constructor({ storeHistory=true, assets=[] }={}) {
    this.events = [];
    this.assets = assets;
    this.eventListeners = [];
    this.storeHistory = storeHistory;
    if (storeHistory) {
      this.readStoredEvents();
    }
  }

  onEvent(callback) {
    this.eventListeners.push(callback);
  }

  removeListener(callback) {
    this.eventListeners.splice(this.eventListeners.indexOf(callback), 1);
  }

  addEvent(event) {
    this.events.push(event);
    this.eventListeners.forEach(callback => callback(event));
    this.storeEvents();
  }

  getEvents(options={}) {
    let events = this.events;
    if (options.asset) {
      events = events.filter(event => event.asset = options.asset);
    }
    return events; //SORT
  }

  storeEvents() {
    if (this.storeHistory) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
    }
  }

  readStoredEvents() {
    if (window.localStorage.getItem(STORAGE_KEY)) {
      const storedEventObjs = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      this.events = [
        ...this.events,
        ...storedEventObjs.map(event => new HistoryEvent(event, this.assets)),
      ];
    }
  }
}

module.exports = History;
