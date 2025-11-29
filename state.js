export const defaultState = {
  mood: 60,
  energy: 70,
  bond: 40,
  curiosity: 50,
};

export function updateState(state, userMessage) {
  const msg = userMessage.toLowerCase();

  if (msg.includes("고마워") || msg.includes("좋아")) {
    state.mood += 4;
    state.bond += 2;
  }

  if (msg.includes("싫어") || msg.includes("미워")) {
    state.mood -= 4;
    state.bond -= 2;
  }

  state.energy -= 1;
  state.curiosity += 1;

  Object.keys(state).forEach(k => {
    state[k] = Math.max(0, Math.min(100, state[k]));
  });

  return state;
}
