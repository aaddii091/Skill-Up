import { defineStore } from 'pinia';

export const useStore = defineStore('store', {
  state: () => ({
    count: 0,
    name: 'Aditya Saxena',
    roomCode: null,
    numberOfQuestions: 0,
    numberOfRounds: 0,
    isHost: false,
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
  },
  actions: {
    updateRoomCode(newRoomCode) {
      this.roomCode = newRoomCode;
    },
    numberOfQuestions(number) {
      this.numberOfQuestions = number;
    },
    numberOfRounds(number) {
      this.numberOfRounds = number;
    },
    updateName(name) {
      this.name = name;
    },
    updateHost(data) {
      this.isHost = data;
    },
  },
});
