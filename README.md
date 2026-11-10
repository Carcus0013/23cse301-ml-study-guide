# 23CSE301 Machine Learning — Study Guide

An exam-preparation website for **23CSE301 Machine Learning** (B.Tech CSE, Semester V, Amrita Vishwa Vidyapeetham), covering all three units of the syllabus.

**Live site:** https://carcus0013.github.io/23cse301-ml-study-guide/

## What's inside

| Page | Contents |
|---|---|
| [Study guide](index.html) | Analysis of the course materials, a question-by-question breakdown of the October 2025 end-semester paper, coverage gaps and the full prioritised syllabus checklist |
| [Unit I](unit-1.html) | 22 topics: ML basics, dimensionality reduction (PCA, LDA, feature selection), KNN, regression and regularization, performance metrics |
| [Unit II](unit-2.html) | 20 topics: decision trees, SVM, Naive Bayes, Markov models and HMMs, neural networks, parameter estimation (MLE, Bayesian, EM) |
| [Unit III](unit-3.html) | 10 topics: K-means and hierarchical clustering, ensembles (bagging, Random Forest, AdaBoost), reinforcement learning |
| [Simulator Lab](lab.html) | All 29 interactive simulators in one place |

Every topic has the theory, formulas, numbered algorithm steps, diagrams and **three fully solved examples** (basic, intermediate, exam level): 156 solved examples in total. All eight October 2025 questions are solved in full.

The 29 simulators cover KNN, gradient descent, logistic regression, Ridge/LASSO, ROC curves, PCA, ID3, SVM margins, Bayes' theorem, Markov chains, Forward/Viterbi, the perceptron, a neural network learning XOR, EM, K-means, dendrograms, bootstrap sampling, AdaBoost, Q-learning and multi-armed bandits. Where a simulator is based on a worked example or paper question, it uses the same numbers.

## Sources

The content is built from the course materials, the October 2025 paper and published references. Each example names its source: Mitchell's *Machine Learning*, Jurafsky & Martin's *Speech and Language Processing*, Hastie, Tibshirani & Friedman's *Elements of Statistical Learning*, Sutton & Barto's *Reinforcement Learning*, Do & Batzoglou (2008), Lindsay Smith's PCA tutorial, Matt Mazur's backpropagation walkthrough, ProPublica's COMPAS analysis, Gender Shades, and others. Examples marked "practice problem" were written for this guide, and every number in them was checked by calculation.

## Running locally

It's a static site with no build step and no dependencies; fonts load from Google Fonts. Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8765
```

and visit http://localhost:8765.
