import { FileItem, ExampleSnippet } from '../types';

export const INITIAL_FILES: FileItem[] = [
  {
    id: '1',
    name: 'main.py',
    path: 'main.py',
    content: `# Welcome to the Online Python IDE & Compiler!
# Type Python code here and click ▶ Run (or press Ctrl+Enter)

import utils

def main():
    print("========================================")
    print("🐍 Welcome to the Interactive Python IDE!")
    print("========================================\n")
    
    # Interactive input test
    name = input("Enter your name: ")
    age = int(input("Enter your age: "))
    
    print(f"\\nNice to meet you, {name}!")
    print(f"You are {age} years old.")
    
    # Using imported utility from utils.py
    greeting = utils.generate_greeting(name, age)
    print(f"\\nStatus: {greeting}")
    
    # Calculate years to 100
    years_left = utils.calculate_years_to_100(age)
    print(f"Years until you turn 100: {years_left}")
    
    # Simple list comprehension & built-ins demonstration
    print("\\nHere are squares of numbers from 1 to 5:")
    squares = [x**2 for x in range(1, 6)]
    print("Squares:", squares)
    print("Sum of squares:", sum(squares))

if __name__ == '__main__':
    main()
`,
    isFolder: false,
    parentId: null,
    isDirty: false,
  },
  {
    id: '2',
    name: 'utils.py',
    path: 'utils.py',
    content: `"""
Utility functions module
Demonstrating multi-file project imports in Python IDE
"""

def generate_greeting(name: str, age: int) -> str:
    if age < 18:
        stage = "a young explorer"
    elif age < 65:
        stage = "an active professional"
    else:
        stage = "a wise elder"
    return f"{name} is {stage}."

def calculate_years_to_100(current_age: int) -> int:
    if current_age >= 100:
        return 0
    return 100 - current_age

def fibonacci_sequence(n: int) -> list:
    """Generate the first n Fibonacci numbers."""
    if n <= 0:
        return []
    seq = [0, 1]
    while len(seq) < n:
        seq.append(seq[-1] + seq[-2])
    return seq[:n]
`,
    isFolder: false,
    parentId: null,
    isDirty: false,
  },
  {
    id: '3',
    name: 'examples',
    path: 'examples',
    content: '',
    isFolder: true,
    parentId: null,
    isExpanded: true,
  },
  {
    id: '4',
    name: 'guessing_game.py',
    path: 'examples/guessing_game.py',
    content: `import random

def play_game():
    secret_number = random.randint(1, 20)
    attempts = 0
    max_attempts = 5
    
    print("🎲 Welcome to the Number Guessing Game!")
    print(f"I'm thinking of a number between 1 and 20.")
    print(f"You have {max_attempts} attempts to guess it.\\n")
    
    while attempts < max_attempts:
        attempts += 1
        try:
            guess = int(input(f"Attempt #{attempts} - Enter your guess (1-20): "))
        except ValueError:
            print("❌ Invalid input. Please enter a valid number.")
            continue
            
        if guess < secret_number:
            print("📈 Too low! Try a higher number.\\n")
        elif guess > secret_number:
            print("📉 Too high! Try a lower number.\\n")
        else:
            print(f"🎉 Congratulations! You guessed the number {secret_number} in {attempts} attempts!")
            return
            
    print(f"😢 Game over! The secret number was {secret_number}.")

if __name__ == '__main__':
    play_game()
`,
    isFolder: false,
    parentId: '3',
    isDirty: false,
  },
  {
    id: '5',
    name: 'bank_account.py',
    path: 'examples/bank_account.py',
    content: `class BankAccount:
    """Demonstrates Object-Oriented Programming in Python"""
    def __init__(self, account_holder: str, initial_balance: float = 0.0):
        self.account_holder = account_holder
        self._balance = initial_balance
        self._transactions = [f"Account created with \${initial_balance:.2f}"]

    @property
    def balance(self) -> float:
        return self._balance

    def deposit(self, amount: float):
        if amount <= 0:
            raise ValueError("Deposit amount must be positive.")
        self._balance += amount
        self._transactions.append(f"Deposited: +\${amount:.2f}")
        print(f"✅ Deposited \${amount:.2f}. New Balance: \${self._balance:.2f}")

    def withdraw(self, amount: float):
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive.")
        if amount > self._balance:
            raise ValueError(f"Insufficient funds! Available: \${self._balance:.2f}")
        self._balance -= amount
        self._transactions.append(f"Withdrew: -\${amount:.2f}")
        print(f"💸 Withdrew \${amount:.2f}. Remaining Balance: \${self._balance:.2f}")

    def print_statement(self):
        print(f"\\n--- Statement for {self.account_holder} ---")
        for entry in self._transactions:
            print(" •", entry)
        print(f"Current Balance: \${self._balance:.2f}")
        print("-----------------------------------")

# Quick demo
account = BankAccount("Alice", 150.0)
account.deposit(50.0)
account.withdraw(30.0)
account.print_statement()
`,
    isFolder: false,
    parentId: '3',
    isDirty: false,
  }
];

export const EXAMPLE_TEMPLATES: ExampleSnippet[] = [
  {
    id: 'interactive-input',
    title: 'Interactive User Input & Profile',
    description: 'Prompts the user for details and prints formatted summary.',
    category: 'Interactive',
    files: [
      {
        name: 'main.py',
        path: 'main.py',
        content: `name = input("Enter your name: ")
age = int(input("Enter your age: "))
city = input("Enter your favorite city: ")

print("\\n" + "="*30)
print(f"Profile for {name}:")
print(f" • Age: {age}")
print(f" • City: {city}")
print(f" • Status: Active Python Explorer")
print("="*30)
`
      }
    ]
  },
  {
    id: 'guessing-game',
    title: 'Number Guessing Game',
    description: 'Classic interactive number guessing game with attempts.',
    category: 'Interactive',
    files: [
      {
        name: 'main.py',
        path: 'main.py',
        content: INITIAL_FILES[3].content
      }
    ]
  },
  {
    id: 'oop-bank',
    title: 'Object-Oriented Bank Account',
    description: 'Classes, methods, properties, and exceptions in Python.',
    category: 'OOP',
    files: [
      {
        name: 'main.py',
        path: 'main.py',
        content: INITIAL_FILES[4].content
      }
    ]
  },
  {
    id: 'data-structures',
    title: 'Data Structures & Algorithms',
    description: 'Lists, Dictionaries, Sets, Tuples, and List Comprehensions.',
    category: 'Data Structures',
    files: [
      {
        name: 'main.py',
        path: 'main.py',
        content: `# Comprehensive Python Data Structures Demo

# 1. Lists & Comprehensions
numbers = [12, 45, 23, 89, 5, 67, 34]
print("Original list:", numbers)
print("Sorted list:  ", sorted(numbers))
print("Evens only:   ", [x for x in numbers if x % 2 == 0])

# 2. Dictionaries
student_scores = {
    "Alice": 94,
    "Bob": 82,
    "Charlie": 88,
    "Diana": 97
}

print("\\nStudent Scores:")
for name, score in student_scores.items():
    print(f" • {name:10}: {score}")

average = sum(student_scores.values()) / len(student_scores)
print(f"Class Average: {average:.2f}")

# 3. Sets & Uniqueness
tags = ["python", "code", "ide", "python", "developer", "ide"]
unique_tags = set(tags)
print("\\nUnique tags set:", unique_tags)
`
      }
    ]
  },
  {
    id: 'fibonacci-recursion',
    title: 'Recursion & Memoization',
    description: 'Fast Fibonacci calculation using caching decorators.',
    category: 'Algorithms',
    files: [
      {
        name: 'main.py',
        path: 'main.py',
        content: `import time
from functools import lru_cache

@lru_cache(maxsize=None)
def fib_memoized(n: int) -> int:
    if n < 2:
        return n
    return fib_memoized(n - 1) + fib_memoized(n - 2)

print("⚡ Computing high Fibonacci numbers with recursion & memoization:")
for i in [10, 20, 30, 40, 50, 75, 100]:
    start = time.perf_counter()
    val = fib_memoized(i)
    elapsed = (time.perf_counter() - start) * 1000
    print(f"Fib({i:3}) = {val:<25} (computed in {elapsed:.4f} ms)")
`
      }
    ]
  }
];
