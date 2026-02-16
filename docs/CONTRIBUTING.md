# Contributing Guidelines

Thank you for considering contributing to the Attendance Management System! We welcome all contributions, from bug fixes to new features.

## Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/your-username/attendance-management.git
    cd attendance-management
    ```
3.  **Create a new branch** for your feature or bugfix:
    ```bash
    git checkout -b feature/my-new-feature
    ```

## Development Process

1.  **Set up the environment**:
    Follow the [Deployment Guide](DEPLOYMENT.md) to install dependencies and configure the database.
2.  **Make your changes**:
    - Build features in `backend/` or `public/`.
    - Ensure your code follows the existing style (Node.js/Express, Vanilla JS).
    - Add comments where necessary.
3.  **Test your changes**:
    - Manually test functionality using the UI.
    - Run `npm test` (if available) or use `API_TESTING.md`.

## Pull Request Process

1.  **Push your branch** to GitHub:
    ```bash
    git push origin feature/my-new-feature
    ```
2.  **Open a Pull Request** against the `main` branch.
3.  **Describe your changes**:
    - What problem does this solve?
    - How did you test it?
    - Any breaking changes?

## Code Standards

-   **JavaScript**: Use ES6+ syntax.
-   **CSS**: Keep it clean and organized. Avoid inline styles where possible.
-   **Commits**: Write clear, descriptive commit messages (e.g., `feat: add user profile page`, `fix: correct login redirect`).

## Reporting Issues

If you find a bug, please open an issue on GitHub with:
-   **Steps to reproduce**.
-   **Expected behavior**.
-   **Actual behavior**.
-   **Screenshots/logs** if applicable.

Thank you for helping improve the project!
