import randomInt from 'random-int';

async function generateRandomSixDigitCode() {
  const min = 100000;
  const max = 999999;
  return randomInt(min, max + 1).toString();
}
export default generateRandomSixDigitCode;
