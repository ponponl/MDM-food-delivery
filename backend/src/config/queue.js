import EventEmitter from 'events';

class AppQueue extends EventEmitter {}
export const messageQueue = new AppQueue();