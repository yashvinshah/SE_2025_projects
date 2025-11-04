# Contributing to This Project

Thank you for your interest in contributing! This document outlines coding standards
and tips to help you extend the system safely.

## Getting Started

1. Fork the repository
2. Clone your fork:
3. Install dependencies: refer `INSTALL.md`

## Branching Model

* Use feature branches: `feature/xyz-description`
* Always branch off `main`
* Open a Pull Request to merge back into `main`
* Have at least one team member review before merging

## Coding Standards

* **Frontend:** TypeScript + React, use `Prettier` for formatting
* **Backend:** Node.js + Firebase, use ESLint rules provided
* Write clear and meaningful commit messages
* Keep functions small and modular
* Document new components and endpoints clearly

## How to Extend the System Safely

* Check for existing routes/components before adding duplicates
* Always write tests for new functionality
* Update `/docs/API.md` and relevant documentation for new features
* Do not directly commit to `main`; always use PR workflow
* Use meaningful variable names and follow consistent formatting
* Keep UI/UX consistent with existing design patterns

## Reporting Issues

* Use GitHub Issues to report bugs or suggest features
* Include steps to reproduce and expected vs actual behavior
* Label your issue appropriately (`bug`, `enhancement`, etc.)

Thank you for helping us make this project better!
