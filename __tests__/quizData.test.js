import { isLevelUnlocked, scoreQuizQuestions } from '../components/quizData';

describe('quiz bank utilities', () => {
  test('scores weighted questions and ignores unanswered items', () => {
    const questions = [
      { id: 'a', correctIndex: 1, points: 3 },
      { id: 'b', correctIndex: 0 },
    ];
    expect(scoreQuizQuestions(questions, { a: 1, b: 4 })).toEqual({ earned: 3, total: 4 });
  });

  test('unlocks the next level at the configured threshold', () => {
    expect(isLevelUnlocked('N4', { best: { N5: 70 } })).toBe(true);
    expect(isLevelUnlocked('N4', { best: { N5: 69 } })).toBe(false);
  });
});
