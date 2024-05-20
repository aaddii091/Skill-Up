import { defineStore } from 'pinia';

export const useStore = defineStore('store', {
  state: () => ({
    count: 0,
    name: 'Eduardo',
    roomCode: 123123,
    numberOfQuestions: 0,
    numberOfRounds: 0,
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
  },
});
