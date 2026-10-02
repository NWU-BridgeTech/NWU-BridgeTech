# Services/Quizzes

WHAT THIS IS: Business logic for quizzes - fetching questions for a quiz, accepting a student's submitted answers, grading them, and storing the result.

WHY GRADING LIVES HERE: Grading is a business rule, not just data storage - it belongs in IQuizService / QuizService, not in the controller and not baked into the QuizQuestion entity itself.
